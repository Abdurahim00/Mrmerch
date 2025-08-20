import { getDatabase } from "@/lib/mongodb"
import type { Template, CreateTemplateData, UpdateTemplateData } from "@/lib/models/Template"

export class TemplateService {
  private collectionName = "templates"

  async createTemplate(data: CreateTemplateData): Promise<Template> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const templateData = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      image: data.image,
      price: data.price,
      category: data.category,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(templateData)
    
    if (!result.acknowledged) {
      throw new Error("Failed to create template")
    }

    return templateData as Template
  }

  async getAllTemplates(): Promise<Template[]> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const templates = await collection.find({}).toArray()
    return templates as unknown as Template[]
  }

  async getTemplateById(id: string): Promise<Template | null> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const template = await collection.findOne({ id })
    return template as unknown as Template | null
  }

  async updateTemplate(data: UpdateTemplateData): Promise<Template> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.image !== undefined) updateData.image = data.image
    if (data.price !== undefined) updateData.price = data.price
    if (data.category !== undefined) updateData.category = data.category

    const result = await collection.updateOne(
      { id: data.id },
      { $set: updateData }
    )

    if (!result.acknowledged || result.matchedCount === 0) {
      throw new Error("Template not found or failed to update")
    }

    const updatedTemplate = await this.getTemplateById(data.id)
    if (!updatedTemplate) {
      throw new Error("Failed to retrieve updated template")
    }

    return updatedTemplate
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const result = await collection.deleteOne({ id })
    return result.deletedCount > 0
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const templates = await collection.find({ category }).toArray()
    return templates as unknown as Template[]
  }

  async searchTemplates(searchTerm: string): Promise<Template[]> {
    const db = await getDatabase()
    const collection = db.collection(this.collectionName)

    const templates = await collection.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ],
    }).toArray()

    return templates as unknown as Template[]
  }
} 