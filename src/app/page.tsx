import { redirect } from "next/navigation";

// Esta aplicação é só o pós-compra. A landing page vive em outro lugar.
export default function Home() {
  redirect("/personalizar");
}
