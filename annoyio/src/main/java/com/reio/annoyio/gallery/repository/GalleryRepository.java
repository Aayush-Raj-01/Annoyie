package com.reio.annoyio.gallery.repository;

import com.reio.annoyio.gallery.entity.GalleryPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryRepository extends JpaRepository<GalleryPost,Long> {
    List<GalleryPost> findAllByOrderByCreatedAtDesc();
    List<GalleryPost> findTop100ByOrderByCreatedAtDesc();
}
