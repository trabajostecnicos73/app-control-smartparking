import { useNavigate } from 'react-router-dom'
import styles from '../estilos/bienvenida.module.css' // Import correcto para CSS Modules
import logo from '../assets/logo.png'
import iconUser from '../assets/usuario.svg'
import iconEscudo from '../assets/escudo.svg'
import iconParking from '../assets/parqueo.svg'
import iconCamera from '../assets/camara.svg'

export default function Bienvenida() {
  const navigate = useNavigate()

  const irALogin = () => {
    navigate('/login')
  }

  return (
    <div className={styles.bienvenidaContainer}>
      <img src={logo} alt="SmartParking Logo" className={styles.logo} />
      <h1 className={styles.titulo}>SmartParking</h1>

      <div className={styles.iconosContainer}>
        <button className={styles.iconoBoton} onClick={irALogin}>
          <img src={iconUser} alt="administracion" />
        </button>
        <button className={styles.iconoBoton} onClick={irALogin}>
          <img src={iconEscudo} alt="Monitoreo" />
        </button>
        <button className={styles.iconoBoton} onClick={irALogin}>
          <img src={iconParking} alt="Parking" />
        </button>
        <button className={styles.iconoBoton} onClick={irALogin}>
          <img src={iconCamera} alt="Seguridad" />
        </button>
      </div>
    </div>
  )
}
