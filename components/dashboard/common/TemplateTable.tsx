"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit3, Trash2 } from "lucide-react"
import Image from "next/image"
import type { Template } from "@/types"
import { formatUSD } from "@/lib/utils"

interface TemplateTableProps {
  templates: Template[]
  loading: boolean
  t: any
  onEdit: (template: Template) => void
  onDelete: (id: string, name: string) => void
}

export function TemplateTable({ templates, loading, t, onEdit, onDelete }: TemplateTableProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Image</TableHead>
              <TableHead className="min-w-[150px]">Name</TableHead>
              <TableHead className="min-w-[100px]">Category</TableHead>
              <TableHead className="min-w-[100px]">Price</TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-16 w-16 rounded-lg" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No templates found</div>
        <p className="text-sm text-gray-400">Create your first template to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
              Image
            </TableHead>
            <TableHead className="min-w-[150px] font-semibold text-slate-700 dark:text-slate-300">
              Name
            </TableHead>
            <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
              Category
            </TableHead>
            <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
              Price
            </TableHead>
            <TableHead className="min-w-[100px] font-semibold text-slate-700 dark:text-slate-300">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template, index) => (
            <TableRow
              key={template.id}
              className={`border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/20"
              }`}
            >
              <TableCell>
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                  <Image
                    src={template.image}
                    alt={template.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                {template.name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                {template.price === "free" ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Free
                  </Badge>
                ) : (
                  formatUSD(template.price)
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(template)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(template.id, template.name)}
                  >
                    <Trash2 className="h-3 w-3" />
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