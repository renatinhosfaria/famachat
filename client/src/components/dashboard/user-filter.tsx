import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface UserFilterProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
}

export default function UserFilter({ selectedUserId, onUserChange }: UserFilterProps) {
  // Buscar lista de usuários da API
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedUserId?.toString() || "all"}
        onValueChange={(value) => {
          if (value === "all") {
            onUserChange(null);
          } else {
            onUserChange(parseInt(value));
          }
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecionar usuário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os usuários</SelectItem>
          {users.map((user: any) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.username} ({user.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}