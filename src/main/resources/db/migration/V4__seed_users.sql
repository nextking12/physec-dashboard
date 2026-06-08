-- Dev/test users. Password for all three: changeme
INSERT INTO users (username, password_hash, role) VALUES
    ('admin',    '$2y$10$0XM9oY7I5yB15cRMMnTLtu/rIZeoWOMzh4GlAxVmZWQ4pYM4jUr/W', 'ADMIN'),
    ('operator', '$2y$10$0XM9oY7I5yB15cRMMnTLtu/rIZeoWOMzh4GlAxVmZWQ4pYM4jUr/W', 'OPERATOR'),
    ('viewer',   '$2y$10$0XM9oY7I5yB15cRMMnTLtu/rIZeoWOMzh4GlAxVmZWQ4pYM4jUr/W', 'VIEWER');
