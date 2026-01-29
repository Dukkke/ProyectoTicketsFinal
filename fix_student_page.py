import os

file_path = r"c:\Users\Alumno\Desktop\Tickets\ProyectoTicket\ProyectoTicket\ProyectoTickets-main (3)\ProyectoTickets-main\ProyectoTickets-main\frontend\src\app\estudiante\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix the phantom block
# Find end of handleFileChange
marker1 = "setJForm(prev => ({ ...prev, files: [] }));\n            }\n        }\n    };"
idx1 = content.find(marker1)
if idx1 == -1:
    print("Error: Could not find end of handleFileChange")
    exit(1)

end_of_part1 = idx1 + len(marker1)

# Find start of Basic renders
marker2 = "// Basic renders"
idx2 = content.find(marker2)
if idx2 == -1:
    print("Error: Could not find // Basic renders")
    exit(1)

start_of_part2 = idx2

# Construct fixed content
toggle_code = """

    const toggleProfessorSelection = (profId: number) => {
        setJForm(prev => {
            const current = prev.professors;
            if (current.includes(profId)) {
                return { ...prev, professors: current.filter(id => id !== profId) };
            } else {
                return { ...prev, professors: [...current, profId] };
            }
        });
    };

"""

# Part 1 + Toggle + Part 2
new_content = content[:end_of_part1] + toggle_code + content[start_of_part2:]

# 2. Update UI
# Find the old file upload block
# It starts with <div className={styles.formGroup}> and contains "Documento de Respaldo (PDF)"
old_ui_start_signature = '                        <div className={styles.formGroup}>\n                            <label className={styles.label}>Documento de Respaldo (PDF)</label>'
idx_ui_start = new_content.find(old_ui_start_signature)

if idx_ui_start == -1:
    # Try with different indentation or just the label
    old_ui_start_signature = '<label className={styles.label}>Documento de Respaldo (PDF)</label>'
    idx_ui_label = new_content.find(old_ui_start_signature)
    if idx_ui_label == -1:
         print("Error: Could not find old UI label")
         # We will proceed with just the structure fix if UI not found, but warn
    else:
        # Find the div wrapping it. It should be the <div className={styles.formGroup}> before it.
        # We'll search backwards for <div className={styles.formGroup}>
        idx_ui_start = new_content.rfind('<div className={styles.formGroup}>', 0, idx_ui_label)

if idx_ui_start != -1:
    # Find the end of this div. It ends after the input.
    # We can look for the next modalButtons div and stop before it?
    # Or count braces?
    # The next block is <div className={styles.modalButtons}>
    idx_next_block = new_content.find('<div className={styles.modalButtons}>', idx_ui_start)
    if idx_next_block != -1:
        # The end of the UI block is the closing </div> before modalButtons
        # We need to find the last </div> before idx_next_block
        idx_ui_end = new_content.rfind('</div>', idx_ui_start, idx_next_block)
        # That rfind finds the closing div of the formGroup?
        # Let's check spacing.
        # The structure is:
        # <div class=formGroup>
        #   <label>...</label>
        #   <div class=fileUploadArea>...</div>
        # </div>
        # <div class=modalButtons>
        
        # So we want to replace from idx_ui_start up to idx_next_block (exclusive), 
        # but we need to keep the spacing or just replace the div.
        
        # New UI
        new_ui = """                        <div style={{ marginTop: '24px' }}>
                                    <label className={styles.label}>
                                        Adjuntar Documentos (PDF)
                                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '8px' }}>
                                            (Máximo 3 archivos. No es obligatorio subir los 3, pero es el límite.)
                                        </span>
                                    </label>
                                    <div style={{
                                        border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '24px',
                                        textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                    }} onClick={() => document.getElementById('file-upload')?.click()}>
                                        <Upload size={32} color="#94a3b8" />
                                        <div style={{ color: '#64748b', fontSize: '14px' }}>
                                            {jForm.files && jForm.files.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ color: '#0369a1', fontWeight: '600' }}>
                                                        {jForm.files.length} archivo(s) seleccionado(s)
                                                    </span>
                                                    {jForm.files.map((f, idx) => (
                                                        <span key={idx} style={{ fontSize: '12px' }}>{f.name}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span>Haz clic para subir los documentos (PDF)</span>
                                            )}
                                        </div>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            multiple
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                </div>
                                
        """
        
        # Replace
        # We need to identify exactly where to stop.
        # The text to remove is from idx_ui_start to the start of <div className={styles.modalButtons}>
        # But wait, there might be whitespace/newlines.
        # Let's replace up to idx_next_block.
        
        new_content = new_content[:idx_ui_start] + new_ui + new_content[idx_next_block:]
        print("Replaced UI block successfully")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("File fixed successfully")
