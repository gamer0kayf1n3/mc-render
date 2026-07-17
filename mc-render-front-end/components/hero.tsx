import styles from "./hero.module.css"
export default function Hero () {

    return <><div className={`${styles.hero} responsive`}>
        <img src="https://mc-render.f1n3.xyz/render?username=gamer0kayf1n3" className={styles.heroImage}/>
        <h1>Minecraft Skin Renders. Simplified.</h1>
    </div>
    </>
}