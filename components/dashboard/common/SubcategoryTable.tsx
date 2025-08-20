import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit3, Trash2 } from "lucide-react"
import type { Subcategory, Category } from "@/types"

interface Props {
  items: Subcategory[]
  categories: Category[]
  loading?: boolean
  onEdit: (s: Subcategory) => void
  onDelete: (id: string) => void
}

export const SubcategoryTable: React.FC<Props> = ({ items, categories, loading, onEdit, onDelete }) => {
  const nameFor = (id: string) => categories.find((c) => c.id === id)?.name || "-"

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <Skeleton className="h-8 w-40" />
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
            <TableHead className="min-w-[160px]">Category</TableHead>
            <TableHead className="min-w-[140px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell className="text-slate-500">{nameFor(s.categoryId)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(s)}>
                    <Edit3 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => onDelete(s.id)}>
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


