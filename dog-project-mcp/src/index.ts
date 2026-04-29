import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { listPets, getPetDetail, searchPets } from "./tools/pets.js";
import { listApplications, reviewApplication, batchReviewApplications } from "./tools/applications.js";
import { batchUpdatePetStatus } from "./tools/status.js";
import { generateOperationsReport, analyzeAdoptionPatterns } from "./tools/analytics.js";
import { getPendingAlerts } from "./tools/alerts.js";
import { notifyFavoriteUsers, listFavorites } from "./tools/favorites.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadDotenv({ path: path.resolve(__dirname, "../.env") });

// ===== MCP Tool 定义 =====

const tools = [
  // 宠物相关
  {
    name: "list_pets",
    description: "列出宠物列表，支持多维筛选（品种、地区、状态等）",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["available", "adopted", "pending", "urgent"], description: "宠物状态" },
        breed: { type: "string", description: "品种（模糊匹配）" },
        region: { type: "string", description: "地区（模糊匹配）" },
        days_pending: { type: "number", description: "待领养天数 >= N" },
        sort_by: { type: "string", enum: ["created_at", "updated_at"], description: "排序字段" },
        sort_order: { type: "string", enum: ["asc", "desc"], description: "排序方向" },
        limit: { type: "number", description: "每页数量，默认 20" },
        offset: { type: "number", description: "分页偏移" },
      },
    },
  },
  {
    name: "get_pet_detail",
    description: "获取宠物详情，包括关联的收藏数和申请数",
    inputSchema: {
      type: "object",
      properties: {
        pet_id: { type: "string", description: "宠物 ID" },
      },
      required: ["pet_id"],
    },
  },
  {
    name: "search_pets",
    description: "关键词搜索宠物（名称、品种、描述）",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "搜索关键词" },
        status: { type: "string", enum: ["available", "adopted", "pending", "urgent"], description: "状态筛选" },
        limit: { type: "number", description: "返回数量，默认 20" },
      },
      required: ["keyword"],
    },
  },
  // 申请相关
  {
    name: "list_applications",
    description: "查询领养申请列表，支持按状态、申请人、宠物筛选",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "approved", "rejected"], description: "申请状态" },
        pet_id: { type: "string", description: "宠物 ID" },
        applicant_id: { type: "string", description: "申请人 ID" },
        days_pending: { type: "number", description: "超过 N 天未处理" },
        limit: { type: "number", description: "每页数量，默认 20" },
        offset: { type: "number", description: "分页偏移" },
      },
    },
  },
  {
    name: "review_application",
    description: "审核单个领养申请，通过或拒绝",
    inputSchema: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "申请 ID" },
        action: { type: "string", enum: ["approve", "reject"], description: "审核动作" },
        comment: { type: "string", description: "审核意见" },
      },
      required: ["application_id", "action"],
    },
  },
  {
    name: "batch_review_applications",
    description: "批量审核申请，最多 20 个",
    inputSchema: {
      type: "object",
      properties: {
        application_ids: { type: "array", items: { type: "string" }, description: "申请 ID 列表" },
        action: { type: "string", enum: ["approve", "reject"], description: "审核动作" },
        comment: { type: "string", description: "审核意见" },
      },
      required: ["application_ids", "action"],
    },
  },
  // 状态管理
  {
    name: "batch_update_pet_status",
    description: "批量更新宠物状态，最多 50 个",
    inputSchema: {
      type: "object",
      properties: {
        pet_ids: { type: "array", items: { type: "string" }, description: "宠物 ID 列表" },
        status: { type: "string", enum: ["available", "adopted", "pending", "urgent"], description: "新状态" },
        condition: { type: "string", description: "触发条件（用于审计）" },
      },
      required: ["pet_ids", "status"],
    },
  },
  // 数据分析
  {
    name: "generate_operations_report",
    description: "生成平台运营报告（今日/本周/本月/本季度）",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "week", "month", "quarter"], description: "统计周期" },
        include_trends: { type: "boolean", description: "是否包含趋势对比" },
      },
      required: ["period"],
    },
  },
  {
    name: "analyze_adoption_patterns",
    description: "分析领养规律，给出洞察和建议",
    inputSchema: {
      type: "object",
      properties: {
        pet_id: { type: "string", description: "宠物 ID（可选，单宠物分析）" },
        region: { type: "string", description: "地区（可选，区域分析）" },
        days: { type: "number", description: "分析天数，默认 90" },
      },
    },
  },
  // 异常检测
  {
    name: "get_pending_alerts",
    description: "获取待处理的异常项（长期待处理、紧急宠物等）",
    inputSchema: {
      type: "object",
      properties: {
        alert_type: { type: "string", enum: ["long_pending", "low_stock", "rejection_spike"], description: "异常类型" },
        threshold_days: { type: "number", description: "超 N 天未处理，默认 30" },
      },
    },
  },
  // 收藏管理
  {
    name: "list_favorites",
    description: "查询收藏列表",
    inputSchema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "用户 ID（不填则查所有）" },
      },
    },
  },
  {
    name: "notify_favorite_users",
    description: "通知收藏了某宠物的用户",
    inputSchema: {
      type: "object",
      properties: {
        pet_id: { type: "string", description: "宠物 ID" },
        message: { type: "string", description: "通知内容" },
      },
      required: ["pet_id", "message"],
    },
  },
];

// ===== MCP Server =====

const server = new Server(
  { name: "dog-project-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case "list_pets":
        result = await listPets(args || {});
        break;
      case "get_pet_detail":
        result = await getPetDetail(args as any);
        break;
      case "search_pets":
        result = await searchPets(args as any);
        break;
      case "list_applications":
        result = await listApplications(args as any);
        break;
      case "review_application":
        result = await reviewApplication(args as any);
        break;
      case "batch_review_applications":
        result = await batchReviewApplications(args as any);
        break;
      case "batch_update_pet_status":
        result = await batchUpdatePetStatus(args as any);
        break;
      case "generate_operations_report":
        result = await generateOperationsReport(args as any);
        break;
      case "analyze_adoption_patterns":
        result = await analyzeAdoptionPatterns(args as any);
        break;
      case "get_pending_alerts":
        result = await getPendingAlerts(args as any);
        break;
      case "list_favorites":
        result = await listFavorites(args?.user_id as string | undefined);
        break;
      case "notify_favorite_users":
        result = await notifyFavoriteUsers(args as any);
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
        },
      ],
      isError: true,
    };
  }
});

// ===== 启动 =====

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[dog-project-mcp] Server started");
}

main().catch(console.error);
