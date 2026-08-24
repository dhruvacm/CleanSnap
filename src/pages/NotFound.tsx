import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <div className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-6xl font-black text-primary">404</p><h1 className="mt-3 text-2xl font-black">Page not found</h1><Link to="/"><Button className="mt-5">Back home</Button></Link></div></div>}
