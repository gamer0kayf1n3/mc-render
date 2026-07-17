import styles from './usage.module.css'
import Input from "./input.tsx"
import { useRef } from 'react'
export default function Usage() {
    const img = useRef<HTMLImageElement>(null)
    const url = useRef<HTMLDivElement>(null)
    function onSubmit(value: string) {
        if (img.current && url.current) {
            var formedURL = `https://mc-render.f1n3.xyz/render?username=${encodeURIComponent(value)}`

            img.current.src = formedURL
            url.current.textContent = formedURL
        }
    }
    return <>
        <div className={`${styles.usage} responsive`}>
            <h2>Usage</h2>
            <p>Type your username below, and get your skin render!</p>
            <Input submitFn={onSubmit} />
            <div className={styles.url} ref={url}>https://mc-render.f1n3.xyz/render?username=gamer0kayf1n3</div>
            <img src="https://mc-render.f1n3.xyz/render?username=gamer0kayf1n3" className={styles.result} ref={img} />
        </div>
    </>
}