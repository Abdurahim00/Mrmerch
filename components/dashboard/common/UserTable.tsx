import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit3, Trash2 } from "lucide-react"
import type { User } from "@/types"

interface UserTableProps {
  users: User[]
  loading: boolean
  t: any
  getRoleColor: (role: string) => string
  onEdit: (user: User) => void
  onDelete: (id: string, email: string) => void
}

export const UserTable: React.FC<UserTableProps> = ({ users, loading, t, getRoleColor, onEdit, onDelete }) => {
  if (loading) return (
    <div className="p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="w-1/5"><Skeleton className="h-8 w-full" /></div>
          <div className="w-2/5"><Skeleton className="h-8 w-full" /></div>
          <div className="w-1/5"><Skeleton className="h-8 w-3/4" /></div>
          <div className="w-1/5 flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
  
  if (!users.length) return <div className="text-center py-12">{t.noUsersFound || "No users found"}</div>
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-primary/10 dark:border-primary/20 bg-primary/5 dark:bg-primary/10">
            <TableHead className="min-w-[120px] font-bold text-primary py-4 text-sm uppercase tracking-wider">{t.customerNumber}</TableHead>
            <TableHead className="min-w-[200px] font-bold text-primary py-4 text-sm uppercase tracking-wider">{t.email}</TableHead>
            <TableHead className="min-w-[100px] font-bold text-primary py-4 text-sm uppercase tracking-wider">{t.role}</TableHead>
            <TableHead className="min-w-[150px] font-bold text-primary py-4 text-sm uppercase tracking-wider">{t.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow 
              key={user.id} 
              className={`border-b transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 ${
                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
              }`}
            >
              <TableCell className="font-mono font-medium text-slate-900 dark:text-slate-100 py-4">{user.customerNumber}</TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300 py-4">{user.email}</TableCell>
              <TableCell className="py-4">
                <Badge className={`${getRoleColor(user.role)} font-medium px-3 py-1 rounded-full text-xs`}>{user.role}</Badge>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(user)} 
                    className="border-primary/30 hover:bg-primary/5 hover:border-primary dark:hover:bg-primary/20 transition-colors text-primary"
                  >
                    <Edit3 className="mr-1.5 h-4 w-4" />{t.edit}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(user.id, user.email)} 
                    className="bg-transparent hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 text-red-600 border-red-200 transition-colors"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />{t.delete}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}