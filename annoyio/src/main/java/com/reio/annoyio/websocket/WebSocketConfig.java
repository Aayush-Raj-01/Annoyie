package com.reio.annoyio.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.messaging.simp.config.ChannelRegistration;
import com.reio.annoyio.security.JwtService;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketConfig(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        registry.addEndpoint("/chat").setAllowedOriginPatterns(origins);
        registry.addEndpoint("/chat").setAllowedOriginPatterns(origins).withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");
                    if (authorization == null || !authorization.startsWith("Bearer ")) {
                        throw new AccessDeniedException("Authentication required");
                    }
                    try {
                        String email = jwtService.extractUsername(authorization.substring(7).trim());
                        Authentication user = new UsernamePasswordAuthenticationToken(email, null, java.util.List.of());
                        accessor.setUser(user);
                    } catch (RuntimeException ex) {
                        throw new AccessDeniedException("Invalid token", ex);
                    }
                }

                if (StompCommand.SEND.equals(accessor.getCommand())
                        && accessor.getDestination() != null
                        && accessor.getDestination().startsWith("/app/")
                        && accessor.getUser() == null) {
                    throw new AccessDeniedException("Authentication required");
                }
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                        && accessor.getDestination() != null
                        && accessor.getDestination().matches("/topic/room/[2-5]")) {
                    if (accessor.getUser() == null) throw new AccessDeniedException("Authentication required");
                    String email = accessor.getUser().getName();
                    int roomId = Integer.parseInt(accessor.getDestination().substring("/topic/room/".length()));
                    boolean allowed = userRepository.findByEmail(email)
                            .map(user -> user.getStudentYear() != null && user.getStudentYear() == roomId - 1)
                            .orElse(false);
                    if (!allowed) throw new AccessDeniedException("This room is restricted to its year group");
                }
                return message;
            }
        });
    }
}
