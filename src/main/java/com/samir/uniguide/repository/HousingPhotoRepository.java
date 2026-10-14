package com.samir.uniguide.repository;


import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.HousingPhoto;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.UUID;

/**
 * Database access for {@link HousingPhoto} rows (metadata only, not the image files).
 */
public interface HousingPhotoRepository extends JpaRepository<HousingPhoto, UUID> {

    /**
     * Returns all photos of a listing, oldest first. Without ORDER BY the database
     * may return rows in any order, and the photo order in the UI would jump around.
     */
    List<HousingPhoto> findAllByHousingOrderByCreatedAtAsc(Housing housing);
}
