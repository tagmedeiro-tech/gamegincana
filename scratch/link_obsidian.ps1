$dir = "c:\Users\Tiago\Desktop\gincana da tribo\obsidian"
$files = Get-ChildItem -Path $dir -Filter *.md -File
foreach ($file in $files) {
    if ($file.Name -in @("Gincana_da_Tribo.md", "PROJECT_KNOWLEDGE.md")) { continue }
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "\[\[Gincana_da_Tribo\]\]") {
        $newContent = "**Voltar para o Inicio:** [[Gincana_da_Tribo]]`n`n" + $content
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    }
}
