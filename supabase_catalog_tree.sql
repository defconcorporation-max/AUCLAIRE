-- Create a new catalog_tree table that supports hierarchical drill-downs
CREATE TABLE IF NOT EXISTS catalog_tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES catalog_tree(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'category', 'model', 'style', 'carat', 'metal'
    image_url TEXT,
    price DECIMAL(12,2),
    specs JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE catalog_tree ENABLE ROW LEVEL SECURITY;

-- Create policies for reading (authenticated users)
CREATE POLICY "Anyone authenticated can view the catalog tree" ON catalog_tree
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for management (admin and secretary)
CREATE POLICY "Admins and Secretaries can manage the catalog tree" ON catalog_tree
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'admin' OR profiles.role = 'secretary')
        )
    );

-- Insert initial top-level categories
INSERT INTO catalog_tree (label, type, description) VALUES ('Bagues', 'category', 'Bagues de fiançailles sur mesure');
INSERT INTO catalog_tree (label, type, description) VALUES ('Alliances', 'category', 'Alliances or et platine');
INSERT INTO catalog_tree (label, type, description) VALUES ('Pendentifs', 'category', 'Colliers et pendentifs diamant');
INSERT INTO catalog_tree (label, type, description) VALUES ('Boucles d''Oreilles', 'category', 'Boucles d''oreilles et puces');
