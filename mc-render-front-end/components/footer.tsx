import styles from "./footer.module.css"
export default function Footer() {
    return <>
        <div className={styles.parentFooter}>
            <div className="responsive">
                <div className={styles.footer}>
                    <div className={styles.footerEls}>
                        <h4>Finn Skin Renderer</h4>
                        <p>Made with ♥ by <a href="https://f1n3.xyz">gamer0kayf1n3</a>.</p>
                        <p>Minecraft is a trademark of Mojang AB. Finn Skin Renderer is not affiliated with or endorsed by Mojang.</p>
                        <p>© 2026 Finn Skin Renderer. All rights reserved.</p>
                    </div>
                    <div className={styles.footerEls}>
                        <ul>
                            <li><a href="/upload">Upload</a></li>
                            <li><a href="/">Homepage</a></li>
                            <li><a href="https://f1n3.xyz">f1n3.xyz</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </>
}