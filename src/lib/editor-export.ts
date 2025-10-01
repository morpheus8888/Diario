import { editorContentSchema } from "@/lib/validations/entry"

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, "")
}

export function editorContentToMarkdown(content: unknown): string {
  const parsed = editorContentSchema.safeParse(content)

  if (!parsed.success) {
    return ""
  }

  const lines = parsed.data.blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return stripHtml(block.data.text ?? "")
        case "header":
          return `${"#".repeat(block.data.level ?? 1)} ${stripHtml(block.data.text ?? "")}`
        case "list": {
          const items: string[] = block.data.items ?? []
          const style = block.data.style === "ordered" ? "ordered" : "unordered"
          return items
            .map((item: string, index: number) =>
              style === "ordered"
                ? `${index + 1}. ${stripHtml(item)}`
                : `- ${stripHtml(item)}`
            )
            .join("\n")
        }
        case "checklist": {
          const items: Array<{ text: string; checked: boolean }> = block.data.items ?? []
          return items
            .map((item) => `- [${item.checked ? "x" : " "}] ${stripHtml(item.text ?? "")}`)
            .join("\n")
        }
        case "quote":
          return `> ${stripHtml(block.data.text ?? "")}`
        case "code":
          return ["```", block.data.code ?? "", "```"].join("\n")
        case "embed":
          return block.data?.source ? `${block.data.source}` : ""
        case "table": {
          const rows: string[][] = block.data.content ?? []
          return rows.map((row) => `| ${row.join(" | ")} |`).join("\n")
        }
        case "image":
          if (block.data?.file?.url) {
            const caption = stripHtml(block.data.caption ?? "")
            return `![${caption}](${block.data.file.url})`
          }
          return ""
        default:
          return ""
      }
    })
    .filter(Boolean)

  return lines.join("\n\n").trim()
}
