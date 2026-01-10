import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.resolve('public/today.json');

function parseDate(dateString) {
    // Parse "10 JANUARY, 2026 - SATURDAY" format
    const match = dateString.match(/(\d+)\s+([A-Z]+),\s+(\d{4})/i);
    if (!match) return null;
    
    const [, day, month, year] = match;
    const monthMap = {
        JANUARY: '01', FEBRUARY: '02', MARCH: '03', APRIL: '04',
        MAY: '05', JUNE: '06', JULY: '07', AUGUST: '08',
        SEPTEMBER: '09', OCTOBER: '10', NOVEMBER: '11', DECEMBER: '12'
    };
    
    const monthNum = monthMap[month.toUpperCase()];
    return `${year}-${monthNum}-${day.padStart(2, '0')}`;
}

async function fetchMarianCalendar() {
    const url = 'https://www.jesusreignsmarianmovement.faith/web/calendar.php?id=2807996&s=1';

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract content from article with class "content"
        const article = $('article.content');
        
        if (article.length === 0) {
            console.log("No article.content found");
            return;
        }

        // Extract date
        const dateText = article.find('h4').first().text().trim();
        const date = parseDate(dateText) || new Date().toISOString().split('T')[0];

        // Extract title (first h3 that contains saint/feast name)
        let title = "Saint of the Day";
        const h3Elements = article.find('h3');
        h3Elements.each((i, el) => {
            const text = $(el).text().trim();
            if (text && text !== "SAINT OF THE DAY" && text.match(/SAINT|BLESSED|FEAST|MEMORIAL/i)) {
                title = text;
                return false;
            }
        });

        // Extract subtitle/rank (e.g., "CONFESSOR, BISHOP AND ABBOT")
        let rank = "memorial";
        const subtitleElement = article.find('p').first();
        const subtitle = subtitleElement.text().trim();

        // Extract main content paragraphs
        const paragraphs = [];
        article.find('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text && text.length > 50) {
                paragraphs.push(text);
            }
        });

        // Extract prayer if available
        let prayer = "";
        article.find('p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.includes('PRAYER:')) {
                prayer = text.replace(/PRAYER:\s*/i, '');
                return false;
            }
        });

        // Build blocks
        const blocks = [
            {
                type: "heading",
                value: title
            }
        ];

        if (subtitle && subtitle !== title) {
            blocks.push({
                type: "text",
                value: subtitle
            });
        }

        // Add first few paragraphs as content
        paragraphs.slice(0, 3).forEach(para => {
            blocks.push({
                type: "text",
                value: para
            });
        });

        if (prayer) {
            blocks.push({
                type: "heading",
                value: "Prayer"
            });
            blocks.push({
                type: "text",
                value: prayer
            });
        }

        // Build today.json structure
        const todayJson = {
            date,
            calendar: "general_roman",
            source: "marian_calendar",
            observance: {
                title,
                type: "saint",
                rank,
                color: "white",
                season: "Ordinary Time",
                isSunday: new Date(date).getDay() === 0,
                isTransferred: false
            },
            saints: [title],
            suppressedObservances: [],
            summary: paragraphs[0] || "Today the Church honors this saint.",
            blocks,
            lastUpdated: new Date().toISOString()
        };

        // Write to file
        fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(todayJson, null, 2));

        console.log("✅ today.json generated successfully");
        console.log("📅 Date:", date);
        console.log("🙏 Title:", title);

    } catch (error) {
        console.error('❌ Error fetching data:', error.message);
    }
}

fetchMarianCalendar();