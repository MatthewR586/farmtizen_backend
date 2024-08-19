- database config 
        ALTER TABLE tbl_store ADD UNIQUE INDEX idx_user_plant (user_id, plant_id);
        set database timezone to utc
        