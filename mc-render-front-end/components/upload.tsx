import { useRef, useState } from 'react'
import styles from './upload.module.css'
import { Turnstile } from '@marsidev/react-turnstile'
export default function Upload() {
    const fileForm = useRef<HTMLInputElement>(null)
    const submitBtn = useRef<HTMLButtonElement>(null)
    var [fileAllowed, setfileAllowed] = useState<boolean>(false)
    var [turnstile, setTurnstile] = useState<boolean>(false)
    function fileChanged() {
        const allowedTypes = ['image/png']
        if (fileForm.current && submitBtn.current) {
            if (fileForm.current.files && fileForm.current.files[0]) {
                const maxSize = 64 * 1024
                const fileSize = fileForm.current.files[0].size
                if (fileSize > maxSize) {
                    alert('This file is too large! Please select a 64x64 <64KB PNG file.')
                    fileForm.current.value = ""
                    setfileAllowed(false)
                } else if (!allowedTypes.includes(fileForm.current.files[0].type)) {
                    alert('Invalid file type! Only PNG files are allowed.')
                    fileForm.current.value = ''
                    setfileAllowed(false)
                } else {
                    setfileAllowed(true)    
                }
            }
        }
    }
    return <div className={styles.form}>
        <form action="/upload" method="POST" encType="multipart/form-data">
            <Turnstile
                siteKey="0x4AAAAAAD3gm_qPRaFInXb8"
                onSuccess={() => {
                    setTurnstile(true)
                }}
                onExpire={() => {
                    setTurnstile(false)
                }}
                onError={() => {
                    setTurnstile(false)

                }}
                style={{
                    order: 99
                }}
            />
            <input type="file" accept="image/png" style= {{order: 1}} ref={fileForm} onChange={fileChanged} required id="file-chooser" name="skin" className={styles.file} />
            <input type="text" required minLength={3} maxLength={16} style= {{order: 2}} name="name" placeholder='Your skin name here...' className={styles.username} />
            <div className={styles.slimdiv} style= {{order: 3}}>
                <label htmlFor="file-chooser" title="A slim skin is a marker that makes your arms' length 3 pixels wide instead of the standard 4 pixels.
Not setting this correctly will result to a broken render.">Slim Skin?</label>
                <input type="checkbox" name="slim" className={styles.checkbox} />
            </div>
            <button type="submit" style={{ order: 100 }} disabled={!(fileAllowed && turnstile)} ref={submitBtn} className={styles.btn}>Upload File</button>
        </form>
    </div>
}