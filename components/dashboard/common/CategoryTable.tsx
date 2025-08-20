import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit3, Trash2 } from "lucide-react"
import type { Category } from "@/types"

interface Props {
  items: Category[]
  loading?: boolean
  onEdit: (c: Category) => void
  onDelete: (id: string) => void
}

export const CategoryTable: React.FC<Props> = ({ items, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead className="min-w-[160px]">Slug</TableHead>
            <TableHead className="min-w-[120px]">Status</TableHead>
            <TableHead className="min-w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell className="text-slate-500">{c.slug}</TableCell>
              <TableCell>
                <Badge className={c.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}>
                  {c.isActive ? "Active" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(c)}>
                    <Edit3 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => onDelete(c.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
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


