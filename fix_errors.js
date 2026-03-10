const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFile(filePath, fixFn) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const newContent = fixFn(content);
    if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function addImport(content, importStatement) {
    if (content.includes(importStatement)) return content;
    // find last import or start of file
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
            lastImportIdx = i;
        }
    }
    if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, importStatement);
    } else {
        lines.unshift(importStatement);
    }
    return lines.join('\n');
}

// 1. Missing Project imports
['src/pages/Dashboard.tsx', 'src/pages/affiliates/AffiliateDashboard.tsx', 'src/pages/analytics/AnalyticsDashboard.tsx', 'src/pages/public/SharedProjectView.tsx'].forEach(p => {
    fixFile(p, (c) => addImport(c, "import { Project } from '../services/apiProjects'"));
});

// 2. Missing UserProfile imports
['src/pages/admin/UsersList.tsx', 'src/components/debug/RoleSwitcher.tsx'].forEach(p => {
    fixFile(p, (c) => addImport(c, "import { UserProfile } from '../../services/apiUsers'"));
});
['src/components/layout/CRMLayout.tsx', 'src/pages/clients/ClientsList.tsx'].forEach(p => {
    fixFile(p, (c) => addImport(c, "import { UserProfile } from '../../services/apiUsers'"));
});
['src/pages/projects/ProjectDetails.tsx', 'src/pages/projects/ProjectsList.tsx'].forEach(p => {
    fixFile(p, (c) => addImport(c, "import { UserProfile } from '../../services/apiUsers'"));
});

// 3. Missing Invoice imports
['src/pages/affiliates/AffiliateDetails.tsx', 'src/pages/analytics/AnalyticsDashboard.tsx', 'src/pages/finance/InvoicesList.tsx'].forEach(p => {
    fixFile(p, (c) => addImport(c, "import { Invoice } from '../../services/apiInvoices'"));
});

// 4. Missing AffiliateProfile imports
fixFile('src/pages/affiliates/AffiliatesList.tsx', c => addImport(c, "import { AffiliateProfile } from '../../services/apiAffiliates'"));

// 5. Missing RingConfig/RingMaterials
fixFile('src/components/3d/RingViewer.tsx', c => addImport(c, "import { RingConfig } from '../../context/RingContext'"));
fixFile('src/components/ui/PreviewModal.tsx', c => {
    let newC = addImport(c, "import { RingConfig } from '../../context/RingContext'");
    return addImport(newC, "import { RingMaterials } from '../../context/RingContext'");
});

// 6. ProjectCard
fixFile('src/components/ui/ProjectCard.tsx', c => addImport(c, "import { Project } from '../../services/apiProjects'"));

// 7. apiAffiliates constant reassignment
fixFile('src/services/apiAffiliates.ts', c => {
    return c.replace('const allProfiles = ', 'let allProfiles = ');
});

// 8. LeadDetails mapping
fixFile('src/pages/crm/LeadDetails.tsx', c => {
    return c.replace('msg: Record<string, unknown>', 'msg: any');
});

// 9. CADLayout string not assignable to never
fixFile('src/components/layout/CADLayout.tsx', c => {
    let replaced = c.replace('const [properties, setProperties] = useState([])', 'const [properties, setProperties] = useState<any[]>([])');
    replaced = replaced.replace('const handleComponentClick = (comp: { id: string })', 'const handleComponentClick = (comp: any)');
    return replaced;
});

// 10. Dashboard Project props missing in Dashboard props/interfaces?
fixFile('src/pages/Dashboard.tsx', c => {
    return addImport(c, "import { Project } from '../services/apiProjects';").replace('import { Project } from \'../services/apiProjects\';\nimport { Project } from \'../services/apiProjects\'', 'import { Project } from \'../services/apiProjects\'');
});

// 11. RingViewer import orbitcontrols error
fixFile('src/components/3d/RingViewer.tsx', c => {
    return c.replace("import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'", "import { OrbitControls } from '@react-three/drei'");
});

// 12. RingModel unused comparison and shape error 
fixFile('src/components/3d/RingModel.tsx', c => {
    let replaced = c.replace('if (prongStyle === "Compass") {', 'if (prongStyle as string === "Compass") {');
    replaced = replaced.replace('if (prongStyle === "Compass") twistAmount = 45;', 'if ((prongStyle as string) === "Compass") twistAmount = 45;');
    replaced = replaced.replace('sideGemShape = config.sideStones.shape || \'Round\'', 'sideGemShape = (config.sideStones as any).shape || \'Round\'');
    replaced = replaced.replace('shape: config.sideStones.shape', 'shape: (config.sideStones as any).shape');
    replaced = replaced.replace('getGemGeometry(sideGemShape)', 'getGemGeometry(sideGemShape as any)');
    return replaced;
});
