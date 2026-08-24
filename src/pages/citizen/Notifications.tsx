import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Notifications(){const {user}=useAuth();const [items,setItems]=useState<any[]>([]);useEffect(()=>{if(user)supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(30).then(({data})=>setItems(data||[]))},[user]);return <div className="mx-auto max-w-2xl space-y-5"><div><h1 className="text-2xl font-black">Notifications</h1><p className="text-sm text-muted-foreground">Updates from your reports and rewards.</p></div><div className="glass-card divide-y">{items.length===0?<div className="p-10 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-3 text-primary"/>No notifications yet.</div>:items.map(n=><div className="p-4" key={n.id}><p className="font-semibold">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.message}</p></div>)}</div></div>}
