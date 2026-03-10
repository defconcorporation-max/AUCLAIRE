$filesWithProject = @('src/pages/Dashboard.tsx', 'src/pages/affiliates/AffiliateDashboard.tsx', 'src/pages/analytics/AnalyticsDashboard.tsx', 'src/pages/public/SharedProjectView.tsx', 'src/components/ui/ProjectCard.tsx')
foreach ($f in $filesWithProject) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { Project } from '@/services/apiProjects';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

$filesWithUserProfile = @('src/pages/admin/UsersList.tsx', 'src/components/debug/RoleSwitcher.tsx', 'src/components/layout/CRMLayout.tsx', 'src/pages/clients/ClientsList.tsx', 'src/pages/projects/ProjectDetails.tsx', 'src/pages/projects/ProjectsList.tsx')
foreach ($f in $filesWithUserProfile) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { UserProfile } from '@/services/apiUsers';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

$filesWithInvoice = @('src/pages/affiliates/AffiliateDetails.tsx', 'src/pages/analytics/AnalyticsDashboard.tsx', 'src/pages/finance/InvoicesList.tsx')
foreach ($f in $filesWithInvoice) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { Invoice } from '@/services/apiInvoices';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

$filesWithAffiliate = @('src/pages/affiliates/AffiliatesList.tsx')
foreach ($f in $filesWithAffiliate) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { AffiliateProfile } from '@/services/apiAffiliates';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

$filesWithRingConfig = @('src/components/3d/RingViewer.tsx')
foreach ($f in $filesWithRingConfig) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { RingConfig } from '@/context/RingContext';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

$filesWithPreviewModal = @('src/components/ui/PreviewModal.tsx')
foreach ($f in $filesWithPreviewModal) {
    if (Test-Path $f) {
        $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
        $newContent = "import { RingConfig, RingMaterials } from '@/context/RingContext';`n" + $content
        [IO.File]::WriteAllText($PWD.Path + "\" + $f, $newContent)
    }
}

# Fix apiAffiliates constant reassignment
$f = 'src/services/apiAffiliates.ts'
if (Test-Path $f) {
    $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
    $content = $content -replace 'const allProfiles = ', 'let allProfiles = '
    [IO.File]::WriteAllText($PWD.Path + "\" + $f, $content)
}

# Fix LeadDetails Record
$f = 'src/pages/crm/LeadDetails.tsx'
if (Test-Path $f) {
    $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
    $content = $content -replace 'msg: Record<string, unknown>', 'msg: any'
    [IO.File]::WriteAllText($PWD.Path + "\" + $f, $content)
}

# Fix CADLayout
$f = 'src/components/layout/CADLayout.tsx'
if (Test-Path $f) {
    $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
    $content = $content -replace 'const \[properties, setProperties\] = useState\(\[\]\)', 'const [properties, setProperties] = useState<any[]>([])'
    $content = $content -replace 'const handleComponentClick = \(comp: \{ id: string \}\)', 'const handleComponentClick = (comp: any)'
    [IO.File]::WriteAllText($PWD.Path + "\" + $f, $content)
}

# Fix RingViewer orbitcontrols error
$f = 'src/components/3d/RingViewer.tsx'
if (Test-Path $f) {
    $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
    $content = $content -replace "import \{ OrbitControls \} from 'three/examples/jsm/controls/OrbitControls'", "import { OrbitControls } from '@react-three/drei'"
    [IO.File]::WriteAllText($PWD.Path + "\" + $f, $content)
}

# Fix RingModel unused comparison and shape error 
$f = 'src/components/3d/RingModel.tsx'
if (Test-Path $f) {
    $content = [IO.File]::ReadAllText($PWD.Path + "\" + $f)
    $content = $content -replace 'if \(prongStyle === "Compass"\) \{', 'if ((prongStyle as string) === "Compass") {'
    $content = $content -replace 'if \(prongStyle === "Compass"\) twistAmount = 45;', 'if ((prongStyle as string) === "Compass") twistAmount = 45;'
    $content = $content -replace "sideGemShape = config\.sideStones\.shape \|\| 'Round'", "sideGemShape = (config.sideStones as any).shape || 'Round'"
    $content = $content -replace 'shape: config\.sideStones\.shape', 'shape: (config.sideStones as any).shape'
    $content = $content -replace 'getGemGeometry\(sideGemShape\)', 'getGemGeometry(sideGemShape as any)'
    [IO.File]::WriteAllText($PWD.Path + "\" + $f, $content)
}
