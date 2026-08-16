import { Link } from "wouter";
import LegalShell from "@/components/LegalShell";

const PLACEHOLDER = "[COMPLETAR POR EL NEGOCIO]";

export default function LegalNotice() {
  return (
    <LegalShell title="Aviso Legal" updated="junio de 2026">
      <p>
        En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI-CE), se facilita la siguiente
        información sobre el titular de este sitio web.
      </p>

      <h2>1. Datos del titular</h2>
      <ul>
        <li>Titular: {PLACEHOLDER}</li>
        <li>NIF/CIF: {PLACEHOLDER}</li>
        <li>Domicilio: Mercado Cerdanyola, Local 5, c/ d'Atenes 11, Mataró (Barcelona)</li>
        <li>Teléfono: {PLACEHOLDER}</li>
        <li>Email: {PLACEHOLDER}</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Esta web permite consultar la carta de Adicto Kebab y realizar pedidos de
        comida para entrega a domicilio en Mataró y alrededores. No se
        realizan pagos online: el pago se efectúa en el momento de la entrega.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        El usuario se compromete a facilitar datos veraces al realizar un pedido
        y a hacer un uso correcto de la web. Los precios mostrados incluyen los
        impuestos aplicables y pueden actualizarse sin previo aviso.
      </p>

      <h2>4. Pedidos</h2>
      <p>
        Un pedido se considera recibido cuando aparece la confirmación en
        pantalla. Nos reservamos el derecho de no aceptar pedidos por causas
        justificadas (zona fuera de reparto, falta de disponibilidad, datos de
        contacto incorrectos, etc.).
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        Los contenidos de esta web (textos, imágenes, marca y diseño) pertenecen
        a su titular o a terceros que han autorizado su uso. No está permitida su
        reproducción sin autorización.
      </p>

      <h2>6. Protección de datos</h2>
      <p>
        El tratamiento de los datos personales se rige por nuestra{" "}
        <Link href="/privacidad">Política de Privacidad</Link>.
      </p>

      <h2>7. Legislación aplicable</h2>
      <p>
        Esta web se rige por la legislación española. Para cualquier
        controversia, las partes se someten a los juzgados y tribunales que
        correspondan conforme a la normativa vigente.
      </p>
    </LegalShell>
  );
}
