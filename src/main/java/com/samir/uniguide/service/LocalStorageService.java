package com.samir.uniguide.service;

import com.samir.uniguide.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * {@link StorageService} that keeps files in a folder on the local disk.
 * The folder comes from {@code storage.local.dir} and is created on startup if it is missing.
 * Every key is resolved inside this folder; keys that point outside it are rejected.
 */
@Service
public class LocalStorageService implements StorageService {

    // absolute and normalized, so the startsWith() check in resolveSafely compares like with like
    private final Path root;

    public LocalStorageService(@Value("${storage.local.dir}") String dir)  {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.root);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }



    @Override
    public String store(MultipartFile file, String folder) {
        String filename = file.getOriginalFilename();
        String ext = StringUtils.getFilenameExtension(filename);
        String suffix = (ext != null) ? "."  + ext : "";

        // only the extension is taken from the client's file name; the name itself is a random UUID,
        // so two uploads never collide and the client cannot choose the path
        String key = folder + "/" + UUID.randomUUID() + suffix;

        Path target = resolveSafely(key);

        try(InputStream in = file.getInputStream()) {
            Files.createDirectories(target.getParent());
            Files.copy(in,target);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        return key;
    }

    @Override
    public Resource load(String key) {
        Path target = resolveSafely(key);
        Resource resource;
        try {
            // the Resource only points to the file; it is read later, when the response is written
            resource = new UrlResource(target.toUri());
        } catch (MalformedURLException e) {
            throw new UncheckedIOException(e);
        }

        if(!(resource.exists() && resource.isReadable())) {
            throw new ResourceNotFoundException("Resource not found");
        }

        return resource;

    }

    @Override
    public void delete(String key) {
        Path target = resolveSafely(key);

        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }


    }


    // turns a key into a path inside root; protects against path traversal,
    // e.g. a key like "../../etc/passwd" would end up outside root after normalize()
    private Path resolveSafely(String key) {
        Path target = root.resolve(key).normalize();
        if(!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid folder name");
        }
        return target;

    }
}
