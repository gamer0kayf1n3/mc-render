import styles from "./input.module.css"
import { useRef } from 'react';

export default function Input({ submitFn }: { submitFn: (value: string) => void }) {

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLSelectElement>(null);

    function platformChanged() {
        if (inputRef.current && dropdownRef.current) {
            if (inputRef.current.value.startsWith("+")) {
                switch (dropdownRef.current.value) {
                    case "+":
                        break
                    case ".":
                        inputRef.current.value = "." + inputRef.current.value.slice(1)
                        break
                    case "":
                        inputRef.current.value = inputRef.current.value.slice(1)
                        break
                }
            } else if (inputRef.current.value.startsWith(".")) {
                switch (dropdownRef.current.value) {
                    case "+":
                        inputRef.current.value = "+" + inputRef.current.value.slice(1)
                        break
                    case ".":
                        break
                    case "":
                        inputRef.current.value = inputRef.current.value.slice(1)
                        break
                }
            } else {
                switch (dropdownRef.current.value) {
                    case "+":
                        inputRef.current.value = "+" + inputRef.current.value
                        break
                    case ".":
                        inputRef.current.value = "." + inputRef.current.value
                        break
                    case "":
                        break
                }
            }
        }
    }
    return <>
        <div className={styles.inputs}>
            <input className={styles.input} type="text" defaultValue="gamer0kayf1n3" ref={inputRef} />
            <select id="platform" className={styles.dropdown} name="platform" onChange={platformChanged} ref={dropdownRef}>
                <option value="">Java</option>
                <option value=".">Bedrock</option>
                <option value="+">Custom</option>
            </select>
            <button className={styles.btn} onClick={() => {if (inputRef.current) submitFn(inputRef.current.value) }}>Render</button>
        </div>
    </>
}