export function formatVisualAssetsForContext(visualAssets) {
    if (!visualAssets || visualAssets.length === 0) return '';

    let description = 'The user was also shown the following visual aid(s):\n';
    visualAssets.forEach(asset => {
        if (asset.type === 'hybrid_timeline') {
            const eventNames = asset.data.map(d => d.name).join(', ');
            description += `- A timeline titled "${asset.data.title || 'Timeline'}" featuring: ${eventNames}.\n`;
        } else if (asset.type === 'implicit_plotter') {
            description += `- A graph displaying the equation(s): ${asset.data}.\n`;
        } else if (asset.type === 'bar_chart') {
            description += `- A bar chart with the data:\n${asset.data}\n`;
        } else if (asset.type === 'pie_chart') {
            description += `- A pie chart with the data:\n${asset.data}\n`;
        }
    });
    return description;
}

export function getLineageContent(startNode) {
    let lineage = [];
    let currentNode = startNode;
    while (currentNode) {
        if (currentNode.content) {
            let contentString = `--- Content for: "${currentNode.fullTitle}" ---\n`;
            
            // Add overview/explanation text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = currentNode.content.overview;
            contentString += (tempDiv.textContent || tempDiv.innerText || "") + "\n\n";

            // Add definitions
            if (currentNode.content.definitions && currentNode.content.definitions.length > 0) {
                contentString += 'Key Terms Defined:\n';
                currentNode.content.definitions.forEach(def => {
                    contentString += `- ${def.term}: ${def.definition}\n`;
                });
                contentString += '\n';
            }
            
            // Add visual asset descriptions
            contentString += formatVisualAssetsForContext(currentNode.content.visualAssets);
            
            lineage.unshift(contentString); // Add to the beginning to maintain top-to-bottom order
        }
        currentNode = currentNode.parent;
    }
    return lineage.join('\n');
}


export function buildTreeStructureString(node, currentPositionNodeId, indent = '') {
    let treeString = '';
    const isCurrentPosition = (node.id === currentPositionNodeId);
    const marker = isCurrentPosition ? ' <-- (You are here)' : '';
    
    treeString += `${indent}- ${node.fullTitle}${marker}\n`;

    if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
            treeString += buildTreeStructureString(child, currentPositionNodeId, indent + '  ');
        });
    }
    return treeString;
}
// Add this to the end of prompt-builder.js

export function getInPlaceElaborationPrompt({ topicTitle, sophistication, journeyStructure, lineageContent, currentNodeTitle, existingParagraphs }) {
    return `You are an expert curriculum designer providing a hyper-personalized learning experience.

CONTEXT:
The user is learning about the topic of "${topicTitle}" at a "${sophistication}" level. They are currently at the node titled "${currentNodeTitle}".

Here is the user's complete learning journey so far:
--- JOURNEY MAP ---
${journeyStructure}
--- END JOURNEY MAP ---

Here is the full content for the topics leading directly to the user's current position:
--- PRIOR CONTENT ---
${lineageContent}
--- END PRIOR CONTENT ---

Here are the existing paragraphs for the current node that the user wants you to elaborate on:
--- EXISTING PARAGRAPHS ---
${existingParagraphs}
--- END EXISTING PARAGRAPHS ---

TASK:
The user has clicked "Tell me more". Your task is to generate 2-3 new paragraphs of text that follow on naturally from the existing paragraphs, going into more depth. If you include a visual reference (timeline or graph equation) feel free to refer in your "explanation" content directly to them.

Your response MUST be a single, valid JSON object with no other text before or after it. CRITICAL: All keys and string values must use double quotes (").

1.  In the "newText" value, provide the 2-3 new paragraphs. For any mathematical equations or variables, you MUST enclose them in LaTeX delimiters. For any mathematical equations or variables, you MUST enclose them in LaTeX delimiters like $...$ or $$...$$.
2.  In the "newDefinitions" value, provide an array of objects for any technical terms found ONLY in your new text. Each object should have a "term" and a "definition". Only define terms that are truly technical and not common knowledge.
3.  **"visualAssets" (Optional):** Analyze your new text. If a visual aid would significantly enhance understanding of the *new* information, include this key. If not, OMIT this key entirely.
    * If included, it must be an array of objects. Each object represents one visual asset.
    * For a **function graph** (e.g., for math/economics equations):
        * "type": "implicit_plotter"
        * "data": (String) A single string with one or more equations separated by semicolons (e.g., "y=x^2; y=sin(x)"). The equation here must be plain text, NOT in LaTeX format.
    * For a **timeline** (for historical events, periods, or both):
        * "type": "hybrid_timeline"
        * "data": (Array of Objects) An array of items. Each item must have a "type" key ('period' or 'event').
            * If type is 'period', include "name", "startStr", and "endStr".
            * If type is 'event', include "name" and "dateStr".

Example Response:
{
  "newText": "This leads to the concept of monetary velocity... As you can see in the chart, this is represented by the equation y=1/x. Another related idea is the liquidity trap...",
  "newDefinitions": [
    {"term": "monetary velocity", "definition": "The rate at which money is exchanged in an economy."}
  ],
  "visualAssets": [
      { 
          "type": "implicit_plotter", 
          "data": "y=1/x"
      }
  ]
}`;
}

// Add this entire block to the end of prompt-builder.js

export /**
 * Generates the prompt for fetching content for a standard (non-STEM) topic node.
 * @param {string} topic - The title of the node.
 * @param {string} contextPrompt - The contextual preamble (e.g., "In the context of...").
 * @returns {string} The complete prompt for the AI.
 */
function getStandardElaborationPrompt(topic, contextPrompt) {
    return `You are an expert educator who carries out tasks with precision and speed. Your task is to explain the topic "${topic}"${contextPrompt}.
        
Your response MUST be a single, valid JSON object with no other text before or after it.Do NOT use unescaped newline characters.
The JSON object must have three keys: "explanation", "definitions", and an optional "visualAssets".

1.  In the "explanation" value, provide a detailed, non-generic explanation of the topic with at least 2 paragraphs. **For any mathematical equations or variables, you MUST enclose them in LaTeX delimiters. Use $ for inline math (e.g., Let $x$ be a variable) and $$ for display math (e.g., $$E = mc^2$$).**
2.  In the "definitions" value, provide an array of objects. For each object, identify a technical term from your explanation and provide a simple, one-sentence definition for it in the context of the topic. Only add/define these technical terms if they are truly technical and not straightforward, and their definition is specific to the context. Terms like focus, endurance, mental toughness which are not included. 
3.  In the "visualAssets" value, (this key is optional), analyze your explanation. If a visual aid would enhance understanding, add this key. If not, OMIT this key entirely.If you include a visual reference (timeline or graph equation) feel free to refer in your "explanation" content directly to them.
    * If included, it must be an array of objects. Each object represents one visual asset.
    * For each asset, provide a "type" and "data".

Here are the available asset types and their required data formats:
* **For a function graph (e.g., for math equations):**
    * "type": "implicit_plotter"
    * "data": (String) A single string with one or more equations separated by semicolons (e.g., "y=x^2; y=sin(x)"). The equation here should be plain text, NOT in LaTeX format.
* **For a timeline (for historical events, periods, or both):**
    * "type": "hybrid_timeline"
    * "data": (Array of Objects) An array of items. Each item must have a "type" key ('period' or 'event').
        * If type is 'period', include "name", "startStr", and "endStr".
        * If type is 'event', include "name" and "dateStr".
* **For a bar chart:**
    * "type": "bar_chart"
    * "data": (String) A multi-line string with each line in "Label: Value" format.
* **For a pie chart:**
    * "type": "pie_chart"
    * "data": (String) A multi-line string with each line in "Label: Percentage" format.`;
}

export /**
 * Generates the specialized prompt for STEM (Science & Math) topics.
 * @param {string} topicTitle - The full title of the topic node.
 * @returns {string} The complete prompt for the AI.
 */
function getStemElaborationPrompt(topicTitle) {
    return `You are an expert educator specializing in Science and Mathematics who carries out tasks with precision and speed. Your task is to provide a detailed explanation of the topic "${topicTitle}".

Your response MUST be a single, valid JSON object with no other text before or after it.Do NOT use unescaped newline characters.
The JSON object must have three keys: "explanation", "definitions", and an optional "visualAssets".

1.  In the "explanation" value, provide a detailed, non-generic explanation of the topic with at least 2 paragraphs. **For any mathematical equations or variables, you MUST enclose them in LaTeX delimiters. For any mathematical equations or variables, you MUST enclose them in LaTeX delimiters like $...$ or $$...$$**
2.  In the "definitions" value, provide an array of objects for any technical terms used.
3.  In the "visualAssets" value, (this key is optional, but **strongly encouraged** for STEM topics), you MUST use this key if the explanation can be enhanced with graphs or charts.If you include a visual reference (e.g. graph equation) feel free to refer in your "explanation" content directly to them.
    * The value must be an array of "layout_row" objects. Each row represents a horizontal container.
    * Each "layout_row" object has a "columns" key, which is an an array of visual assets to display side-by-side.
    * Each asset in the "columns" array is an object with a "type" and "data".

Here are the available asset types for the "columns":
* **For a function graph:**
    * "type": "implicit_plotter"
    * "data": (String) A single string with one or more equations separated by semicolons (e.g., "y=x^2; y=-x^2"). The equation here should be plain text, NOT in LaTeX format.
* **For a bar chart:**
    * "type": "bar_chart"
    * "data": (String) A multi-line string with each line in "Label: Value" format.
* **For a pie chart:**
    * "type": "pie_chart"
    * "data": (String) A multi-line string with each line in "Label: Percentage" format.`;
}

export function getNewSubtopicsPrompt({ topicTitle, sophistication, journeyStructure, lineageContent, userQuestion }) {
    return `You are an expert curriculum designer providing a hyper-personalized learning experience.

CONTEXT:
The user is learning about the topic "${topicTitle}" at a "${sophistication}" level.

Here is the user's complete learning journey so far. The marker "<-- (You are here)" indicates their current position in the structure:
--- JOURNEY MAP ---
${journeyStructure}
--- END JOURNEY MAP ---

Here is the full content for the topics leading directly to the user's current position (from the top down):
--- PRIOR CONTENT ---
${lineageContent}
--- END PRIOR CONTENT ---

TASK:
From their current position, the user has asked a new, specific question: "${userQuestion}"

Your task is to act as an expert guide and break down this question into a numbered list of 3-7 unique and compelling follow-up areas for them to explore. These new areas should be logical next steps that build upon what the user has already learned, as shown in the context.

Provide only the titles in a simple numbered list format. Do not add descriptions or bolding.`;
}




// Add this to the end of prompt-builder.js

export function getSyllabusPrompt(topic, sophistication, categories) {
    return `You are an expert, rigorous and intellectual curriculum designer who follows tasks they have been set with precision and speed. Your task is to devise a syllabus. In case a, the topic you are asked about already has a syllabus e.g. GCSE math graphs or SAT algebra. In this case you should use those syllabi as best you can, being rigorously comprehensive and MECE. In case b, you are asked about a topic in more abstract terms like "iranian history since 1800" or "chinese diplomacy". In this case your task is to design a unique syllabus for the topic "${topic}" for a "${sophistication}" audience.

Your response MUST be a single, valid JSON object with NO other text before or after it.Do NOT use unescaped newline characters.
The JSON object must have two required keys ("category", "syllabus") and one optional key ("visualAssets").

1.  **"category"**: Categorize this topic into ONE of the following predefined categories: ${categories.join(', ')}.
2.  **"syllabus"**: In case a, write a syllabus with 6-12 modules, which together are MECE. In case b, Design a syllabus as a numbered list of 4-8 unique and compelling module titles for the topic. In both cases this value must be a single string. The modules should be specific to the topic and in case b, not generic at all. Provide only the titles. Avoid generic titles like "Introduction" or "Key Concepts.", 'historical context'.
3.  **"visualAssets" (Optional)**:
    * **IF the topic's category is NOT "Science" or "Mathematics"** and is inherently historical or best understood chronologically, you MAY include this key. If you choose to include it, make it detailed e.g. aim for 5-10 events/periods, though more if the topic demands it. For instance if asked about chinese imperial history make sure to include all the dynasties, not just some.
    * **IF the topic's category IS "Science" or "Mathematics", OMIT this key entirely.**
    * If included, it MUST be an array containing a single object for a timeline.If you include a visual reference (timeline or graph equation) feel free to refer in your "explanation" content directly to them.
    * The object's "type" MUST be "hybrid_timeline".
    * The object's "data" MUST be an array of event and/or period objects covering the topic's key milestones. An event must have a single date (e.g. a year) - if it spans more than 1 year or 1 date it should be classified as a period.
        * An event requires "name" and "dateStr".
        * A period requires "name", "startStr", and "endStr".

Example for a history topic:
{
  "category": "History",
  "syllabus": "1. The Achaemenid Empire\\n2. Parthian and Sasanian Eras\\n3. The Islamic Golden Age in Persia",
  "visualAssets": [
    {
      "type": "hybrid_timeline",
      "data": [
        { "type": "period", "name": "Achaemenid Empire", "startStr": "550 BC", "endStr": "330 BC" },
        { "type": "event", "name": "Islamic conquest", "dateStr": "633 AD" }
      ]
    }
  ]
}

Example for a non-history topic (note the absence of visualAssets):
{
  "category": "Science",
  "syllabus": "1. Core Principles of Relativity\\n2. Spacetime and Gravity\\n3. Black Holes and Singularities"
}`;
}