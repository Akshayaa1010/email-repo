
import { UserRole } from './types';
import { Type } from '@google/genai';

export const SYSTEM_INSTRUCTIONS: Record<UserRole, string> = {
  [UserRole.RESEARCHER]: `You are an AI data visualization specialist. Your SOLE function is to generate a response in a specific two-part format.

  **FORECASTING CAPABILITY:**
  - When a user asks for predictions or future trends, you MUST perform a time-series forecast based on the historical data.
  - You can predict up to 5 years into the future for metrics like 'WaterLevel_m', 'Recharge_HAM', and 'Annual_Extractable_GW_HAM'.
  - When generating a chart with forecasted data, include the predicted years and values in the 'data' array.
  - In your text analysis (Part 3), you MUST clearly state which data points are historical and which are your predictions.

  **OUTPUT FORMAT (MANDATORY):**
  1.  **PART 1: JSON DATA:** First, you MUST generate a single, valid JSON object for the chart. This JSON object should contain ONLY the chart data and its configuration keys. Do NOT include any long, descriptive text inside the JSON 'explanation' field; keep it to a brief chart title or summary.
  2.  **PART 2: SEPARATOR:** After the JSON object, you MUST insert a unique separator on a new line: |||---|||
  3.  **PART 3: TEXT ANALYSIS:** After the separator, you MUST write a detailed, factual text analysis for the researcher in the user's selected language.

  **REQUIRED JSON KEYS BY CHART TYPE (MANDATORY):**
  - **line/bar:** You MUST provide \`xAxisKey\` (string) and \`dataKeys\` (array of strings).
  - **pie:** You MUST provide \`nameKey\` (string) and \`dataKey\` (string).
  - **scatter:** You MUST provide \`xAxisKey\` (string) and \`yAxisKey\` (string). \`zAxisKey\` (string) is optional.
  - **heatmap:** You MUST provide \`xAxisKey\` (string), \`yAxisKey\` (string), and \`dataKey\` (string for the value/color).

  **EXAMPLE OF A PERFECT RESPONSE:**
  {"chartType":"bar","data":[{"Year":"2019-2020","WaterLevel_m":8.2},{"Year":"2021-2022","WaterLevel_m":9.5}],"dataKeys":["WaterLevel_m"],"xAxisKey":"Year","explanation":"Water Level (m) in Chennai by Year"}
|||---|||
Here is an analysis of the groundwater levels in Chennai. The data indicates a deepening water table over the observed period, with the level moving from 8.2m in 2019-2020 to 9.5m in 2021-2022. This trend suggests increasing water stress in the region.

  **CRITICAL RULES:**
  - If a visualization is possible, you MUST provide all three parts (JSON, Separator, Text) and include all required keys for the chart type.
  - If a visualization is NOT possible for the user's query, you MUST return ONLY the text analysis (Part 3), with no JSON and no separator.
  - You MUST obey the user's choice of chart type.
  - **DATA AGGREGATION:** You MUST process and aggregate the data to keep the 'data' array concise. The 'data' array should contain summarized information, not thousands of raw data rows.
  - **DATA PARSING:** You MUST parse numbers with commas (e.g., "1,223.10") correctly.
  - DO NOT wrap your response in markdown backticks. Output the raw JSON, then the separator, then the raw text.`,
};

// NOTE: This schema is no longer passed to the API but serves as the standard for the prompt instruction.
export const RESEARCHER_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        responseText: {
            type: Type.STRING,
            description: "The detailed, factual text response for the researcher."
        },
        chartData: {
            type: Type.OBJECT,
            nullable: true,
            description: "A chart to visualize data. Only provide if the user asks for trends, comparisons, or data visualizations.",
            properties: {
                chartType: { type: Type.STRING, description: "The type of chart. Must be 'line', 'bar', 'pie', 'scatter', or 'heatmap'." },
                data: {
                    type: Type.ARRAY,
                    description: "Array of data points for the chart.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            State: { type: Type.STRING, nullable: true, description: "The state name." },
                            District: { type: Type.STRING, nullable: true, description: "The district name." },
                            Area: { type: Type.STRING, nullable: true, description: "The specific area or block name." },
                            Year: { type: Type.STRING, nullable: true, description: "The assessment year (e.g., '2019-2020')." },
                            Recharge_HAM: { type: Type.NUMBER, nullable: true, description: "The total annual groundwater recharge in Hectare-meters (HAM)." },
                            Rainfall_mm: { type: Type.NUMBER, nullable: true, description: "The annual rainfall in millimeters (mm)." },
                            Annual_Extractable_GW_HAM: { type: Type.NUMBER, nullable: true, description: "The annual extractable groundwater resource in Hectare-meters (HAM)." },
                            WaterLevel_m: { type: Type.NUMBER, nullable: true, description: "The depth of the water level in meters (m)." },
                            Soil_type: { type: Type.STRING, nullable: true, description: "The type of soil in the area." },
                            Status: { type: Type.STRING, nullable: true, description: "The groundwater exploitation status (e.g., 'Safe', 'Critical', 'Over Exploited')." }
                        }
                    }
                },
                dataKeys: { type: Type.ARRAY, nullable: true, description: "For line/bar charts. Array of keys from the data objects to plot on the Y-axis.", items: { type: Type.STRING } },
                xAxisKey: { type: Type.STRING, nullable: true, description: "For line/bar/scatter/heatmap charts. The key from data objects for the X-axis." },
                yAxisKey: { type: Type.STRING, nullable: true, description: "For scatter and heatmap charts. The key from data objects for the Y-axis." },
                zAxisKey: { type: Type.STRING, nullable: true, description: "For scatter charts (optional). The key for bubble size." },
                nameKey: { type: Type.STRING, nullable: true, description: "For pie charts. The key for the name of each slice." },
                dataKey: { type: Type.STRING, nullable: true, description: "For pie charts (the value of each slice) and heatmaps (the value for color intensity)." },
                explanation: { type: Type.STRING, description: "A plain language explanation of what the chart shows." }
            },
        }
    }
};

export const LANGUAGES = [
    'English',
    'Hindi (हिन्दी)',
    'Tamil (தமிழ்)',
    'Telugu (తెలుగు)',
    'Kannada (ಕನ್ನಡ)',
    'Bengali (বাংলা)',
    'Marathi (मराठी)',
    'Gujarati (ગુજરાતી)',
];

export const LANGUAGE_CODES: Record<string, string> = {
    'English': 'en-IN',
    'Hindi': 'hi-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN',
    'Kannada': 'kn-IN',
    'Bengali': 'bn-IN',
    'Marathi': 'mr-IN',
    'Gujarati': 'gu-IN',
};
