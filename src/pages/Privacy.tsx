import LegalShell from "@/components/LegalShell";

const PLACEHOLDER = "[COMPLETAR POR EL NEGOCIO]";

export default function Privacy() {
  return (
    <LegalShell title="Política de Privacidad" updated="junio de 2026">
      <p>
        En Adicto Kebab nos tomamos en serio la protección de tus datos. Esta
        política explica qué datos recogemos cuando haces un pedido y para qué
        los usamos, conforme al Reglamento General de Protección de Datos (RGPD)
        y a la normativa española vigente.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Titular: {PLACEHOLDER}</li>
        <li>NIF/CIF: {PLACEHOLDER}</li>
        <li>Dirección: Mercado Cerdanyola, Local 5, c/ d'Atenes 11, Mataró (Barcelona)</li>
        <li>Email de contacto: {PLACEHOLDER}</li>
      </ul>

      <h2>2. Qué datos recogemos</h2>
      <p>
        Solo recogemos los datos imprescindibles para preparar y entregar tu
        pedido:
      </p>
      <ul>
        <li>Nombre</li>
        <li>Teléfono de contacto</li>
        <li>Dirección de entrega (calle, número, población e indicaciones)</li>
        <li>Detalle del pedido y método de pago elegido</li>
      </ul>
      <p>
        <strong>No realizamos pagos online</strong> a través de esta web, por lo
        que no recogemos ni almacenamos datos bancarios ni de tarjetas. El pago
        se realiza en el momento de la entrega.
      </p>

      <h2>3. Para qué usamos tus datos</h2>
      <ul>
        <li>Gestionar, preparar y entregar tu pedido.</li>
        <li>Contactarte si hay cualquier incidencia con el pedido.</li>
      </ul>
      <p>
        No usamos tus datos para publicidad ni los cedemos a terceros con fines
        comerciales.
      </p>

      <h2>4. Base legal</h2>
      <p>
        La base legal es la ejecución del pedido que nos solicitas (relación
        contractual) y tu consentimiento al marcar la casilla de aceptación en
        el formulario de pedido.
      </p>

      <h2>5. Cuánto tiempo conservamos tus datos</h2>
      <p>
        Conservamos los datos del pedido durante el tiempo necesario para su
        gestión y para cumplir las obligaciones legales y fiscales aplicables.
        Después se eliminan o se bloquean.
      </p>

      <h2>6. Con quién compartimos tus datos</h2>
      <p>
        Tus datos se tratan internamente para gestionar el pedido. Únicamente se
        comparten con el repartidor lo necesario para realizar la entrega. No se
        transfieren fuera de la Unión Europea.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación y portabilidad escribiendo a {PLACEHOLDER}.
        También puedes presentar una reclamación ante la Agencia Española de
        Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Esta web funciona sobre conexión segura (HTTPS) y aplicamos medidas
        razonables para proteger tus datos frente a accesos no autorizados.
      </p>
    </LegalShell>
  );
}
