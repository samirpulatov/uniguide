package com.samir.uniguide.service;


import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stores uploaded files outside the database.
 * Files are addressed by a storage key like {@code housing/<uuid>.jpg}, never by an absolute
 * path or URL, so the database does not depend on where the files really live.
 * Today the only implementation is {@link LocalStorageService}; an S3-compatible one (e.g. MinIO)
 * can be added later without changing the callers.
 */
public interface StorageService {
    /**
     * Saves a file under a new, server-generated name.
     *
     * @param file   the uploaded file
     * @param folder first part of the key, groups files by feature (e.g. {@code "housing"})
     * @return the storage key to save in the database
     */
    String store(MultipartFile file, String folder);

    /**
     * Opens a stored file for reading.
     *
     * @param key the storage key returned by {@link #store}
     * @return the file as a {@link Resource}
     * @throws com.samir.uniguide.exception.ResourceNotFoundException if there is no such file
     */
    Resource load(String key);

    /**
     * Deletes a stored file. Deleting a file that does not exist is not an error.
     *
     * @param key the storage key returned by {@link #store}
     */
    void delete(String key);
}
