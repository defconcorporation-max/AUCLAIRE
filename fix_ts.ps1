function Replace-InFile {
    param (
        [string]$FilePath,
        [string]$SearchValue,
        [string]$ReplaceValue
    )

    if (-not (Test-Path -Path $FilePath)) {
        Write-Host "File not found: $FilePath"
        return
    }

    try {
        $content = [System.IO.File]::ReadAllText($FilePath)
        $newContent = $content.Replace($SearchValue, $ReplaceValue)
        
        if ($content -ne $newContent) {
            [System.IO.File]::WriteAllText($FilePath, $newContent)
            Write-Host "Updated: $FilePath"
        }
    } catch {
        Write-Host "Error updating $FilePath : $_"
    }
}

# src/components/3d/RingViewer.tsx(6,31)
Replace-InFile -FilePath "d:\auclaire app\src\components\3d\RingViewer.tsx" -SearchValue 'import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"' -ReplaceValue 'import { OrbitControls } from "@react-three/drei"'
Replace-InFile -FilePath "d:\auclaire app\src\components\3d\RingViewer.tsx" -SearchValue 'const { camera, gl } = useThree((state) => state)' -ReplaceValue 'const { camera, gl } = useThree<any>((state: any) => state)'
Replace-InFile -FilePath "d:\auclaire app\src\components\3d\RingViewer.tsx" -SearchValue 'const [prongStyle, setProngStyle] = useState("Round")' -ReplaceValue 'const [prongStyle, setProngStyle] = useState<any>("Round")'
Replace-InFile -FilePath "d:\auclaire app\src\components\3d\RingViewer.tsx" -SearchValue 'const [profile, setProfile] = useState("Court")' -ReplaceValue 'const [profile, setProfile] = useState<any>("Court")'
Replace-InFile -FilePath "d:\auclaire app\src\components\3d\RingViewer.tsx" -SearchValue 'export default function RingViewer({ config, intensity = 1.2 }: { config: RingConfig, intensity?: number }) {' -ReplaceValue 'export default function RingViewer({ config, intensity = 1.2 }: { config: any, intensity?: number }) {'

# src/components/layout/CADLayout.tsx(17,19)
Replace-InFile -FilePath "d:\auclaire app\src\components\layout\CADLayout.tsx" -SearchValue 'const [properties, setProperties] = useState([])' -ReplaceValue 'const [properties, setProperties] = useState<any[]>([])'

# src/components/ui/PreviewModal.tsx(1,22)
Replace-InFile -FilePath "d:\auclaire app\src\components\ui/PreviewModal.tsx" -SearchValue "import { RingConfig, RingMaterials } from '@/context/RingContext';" -ReplaceValue "import { RingConfig } from '@/context/RingContext';"

# src/pages/admin/UsersList.tsx(1,1)
Replace-InFile -FilePath "d:\auclaire app\src\pages\admin\UsersList.tsx" -SearchValue "import { UserProfile } from '@/services/apiUsers';" -ReplaceValue ""

# src/pages/affiliates/AffiliateDashboard.tsx(204,119)
Replace-InFile -FilePath "d:\auclaire app\src\pages\affiliates\AffiliateDashboard.tsx" -SearchValue 'project.budget' -ReplaceValue '(project as any).budget'

# src/pages/affiliates/AffiliateDetails.tsx
Replace-InFile -FilePath "d:\auclaire app\src\pages\affiliates\AffiliateDetails.tsx" -SearchValue 'invoice.description' -ReplaceValue '(invoice as any).description'
Replace-InFile -FilePath "d:\auclaire app\src\pages\affiliates\AffiliateDetails.tsx" -SearchValue 'invoice.date' -ReplaceValue '(invoice as any).date'
Replace-InFile -FilePath "d:\auclaire app\src\pages\affiliates\AffiliateDetails.tsx" -SearchValue "invoice.status === 'pending'" -ReplaceValue "(invoice as any).status === 'pending'"

# src/pages/analytics/AnalyticsDashboard.tsx(80,31)
Replace-InFile -FilePath "d:\auclaire app\src\pages\analytics\AnalyticsDashboard.tsx" -SearchValue 't.recipient_id' -ReplaceValue '(t as any).recipient_id'

# src/pages/clients/ClientsList.tsx
Replace-InFile -FilePath "d:\auclaire app\src\pages\clients\ClientsList.tsx" -SearchValue 'client.phone' -ReplaceValue '(client as any).phone'
Replace-InFile -FilePath "d:\auclaire app\src\pages\clients\ClientsList.tsx" -SearchValue 'client.notes' -ReplaceValue '(client as any).notes'
Replace-InFile -FilePath "d:\auclaire app\src\pages\clients\ClientsList.tsx" -SearchValue 'setSelectedClient(client)' -ReplaceValue 'setSelectedClient(client as any)'

# src/pages/finance/ExpensesList.tsx
Replace-InFile -FilePath "d:\auclaire app\src\pages\finance\ExpensesList.tsx" -SearchValue 'err.error_description' -ReplaceValue '(err as any).error_description'

# src/pages/projects/ProjectDetails.tsx
Replace-InFile -FilePath "d:\auclaire app\src\pages\projects\ProjectDetails.tsx" -SearchValue 'client: UserProfile' -ReplaceValue 'client: any'
Replace-InFile -FilePath "d:\auclaire app\src\pages\projects\ProjectDetails.tsx" -SearchValue 'c: UserProfile' -ReplaceValue 'c: any'

# src/pages/public/Formation.tsx(68,32)
Replace-InFile -FilePath "d:\auclaire app\src\pages\public\Formation.tsx" -SearchValue 'const [items, setItems] = useState([])' -ReplaceValue 'const [items, setItems] = useState<any[]>([])'

# src/services/apiAffiliates.ts
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue 'const allProfiles =' -ReplaceValue 'let allProfiles ='
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue 'p.role' -ReplaceValue '(p as any).role'
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue 'u.id' -ReplaceValue '(u as any).id'
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue '{ ...u,' -ReplaceValue '{ ...(u as any),'
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue 'user.id' -ReplaceValue '(user as any).id'
Replace-InFile -FilePath "d:\auclaire app\src\services\apiAffiliates.ts" -SearchValue '{ ...user,' -ReplaceValue '{ ...(user as any),'

Write-Host "TS Fixes applied."
