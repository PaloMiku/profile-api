import { Octokit } from '@octokit/rest';
import fs from 'fs-extra';
import path from 'path';

const username = process.env.PROFILE_USERNAME || process.argv[2] || 'PaloMiku';
const out = process.env.HEATMAP_FILE || 'data/heatmap.json';

async function fetchHeatmap() {
  console.log(`Fetching GitHub contributions for ${username}...`);
  
  // 使用 GitHub API 获取贡献数据
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN // GitHub Action 会自动提供 token
  });
  
  try {
    // 获取用户的公开事件
    const { data } = await octokit.rest.activity.listPublicEventsForUser({
      username: username,
      per_page: 100,
    });
    
    // 按日期聚合贡献数据
    const contributionMap = new Map();
    
    // 初始化过去一年的每一天
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      contributionMap.set(dateStr, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 统计每天的贡献数
    data.forEach(event => {
      if (event.created_at) {
        const dateStr = event.created_at.split('T')[0];
        if (contributionMap.has(dateStr)) {
          contributionMap.set(dateStr, contributionMap.get(dateStr) + 1);
        }
      }
    });
    
    // 转换为数组格式
    const heatmapData = Array.from(contributionMap.entries()).map(([date, count]) => ({
      date,
      count
    }));
    
    await fs.ensureDir(path.dirname(out));
    const result = { 
      username, 
      updatedAt: new Date().toISOString(), 
      data: heatmapData,
      totalContributions: heatmapData.reduce((sum, day) => sum + day.count, 0)
    };
    
    await fs.writeJSON(out, result);
    console.log(`Saved heatmap to ${out} (${heatmapData.length} items, ${result.totalContributions} total contributions)`);
  } catch (error) {
    console.error('Failed to fetch heatmap:', error.message);
    process.exit(1);
  }
}

fetchHeatmap();
