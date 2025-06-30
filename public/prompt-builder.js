function getSharedContextBlock({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent }) {
    return `CONTEXT:
The user is learning about the topic of "${topicTitle}" at a "${sophistication}" level. They are currently at the node titled "${currentNodeTitle}".

Here is the user's complete learning journey so far:
--- JOURNEY MAP ---
${journeyStructure}
--- END JOURNEY MAP ---

Here is the full content for the topics leading directly to the user's current position:
--- PRIOR CONTENT ---
${lineageContent}
--- END PRIOR CONTENT ---`;
}

const DETAILED_JSON_FORMAT_INSTRUCTIONS = `Your response MUST be a single, valid JSON object with no other text before or after it.Do NOT use unescaped newline characters.
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

export function getInPlaceElaborationPrompt({ topicTitle, sophistication, journeyStructure, lineageContent, currentNodeTitle, existingParagraphs }) {
    // Note: The 'currentNodeTitle' from the parameters is now passed into the shared context block.
    const sharedContext = getSharedContextBlock({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent });

    return `You are an expert curriculum designer providing a hyper-personalized learning experience.

${sharedContext}

Here are the existing paragraphs for the current node that the user wants you to elaborate on:
--- EXISTING PARAGRAPHS ---
${existingParagraphs}
--- END EXISTING PARAGRAPHS ---

TASK:
The user has clicked "Tell me more". Your task is to generate 2-3 new paragraphs of text that follow on naturally from the existing paragraphs, going into more depth. Place this new text in the "explanation" key of the JSON response.

${DETAILED_JSON_FORMAT_INSTRUCTIONS}`;
}

// Add this entire block to the end of prompt-builder.js

export function getStandardElaborationPrompt({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent, contextPrompt }) {
    const sharedContext = getSharedContextBlock({
        topicTitle,
        sophistication,
        currentNodeTitle,
        journeyStructure,
        lineageContent
    });

    return `You are an expert educator who carries out tasks with precision and speed.
    
${sharedContext}

TASK:
Your task is to explain the topic "${currentNodeTitle}"${contextPrompt}, with 2-3 paragraphs.

${DETAILED_JSON_FORMAT_INSTRUCTIONS}`;
}

export function getStemElaborationPrompt({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent }) {
    const sharedContext = getSharedContextBlock({
        topicTitle,
        sophistication,
        currentNodeTitle,
        journeyStructure,
        lineageContent
    });

    return `You are an expert educator specializing in Science, Mathematics and Economics who carries out tasks with precision and speed.
    
${sharedContext}

TASK:
Your task is to provide a detailed explanation of the topic "${currentNodeTitle}", with 2-3 paragraphs. 

${DETAILED_JSON_FORMAT_INSTRUCTIONS}`;
}

export function getNewSubtopicsPrompt({ topicTitle, sophistication, journeyStructure, lineageContent, userQuestion, currentNodeTitle }) {
    // Note: We need to pass 'currentNodeTitle' to this function to build the context.
    const sharedContext = getSharedContextBlock({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent });

    return `You are an expert curriculum designer providing a hyper-personalized learning experience.

${sharedContext}

TASK:
From their current position, the user has asked a new, specific question: "${userQuestion}"

Your task is to act as an expert guide and break down this question into a numbered list of 3-7 unique and compelling follow-up areas for them to explore. These new areas should be logical next steps that build upon what the user has already learned, as shown in the context.

Provide only the titles in a simple numbered list format. Do not add descriptions or bolding.`;
}


export function getPrefetchPrompt({ topicTitle, sophistication, currentNodeTitle, journeyStructure, lineageContent, contextPrompt }) {
    const sharedContext = getSharedContextBlock({
        topicTitle,
        sophistication,
        currentNodeTitle,
        journeyStructure,
        lineageContent
    });

    return `You are an expert educator who carries out tasks with precision and speed.
    
${sharedContext}

TASK:
Your task is to explain the topic "${currentNodeTitle}"${contextPrompt} in 2-3 paragraphs.

${DETAILED_JSON_FORMAT_INSTRUCTIONS}`;
}


export function getTimelineElaborationPrompt({ overallTopic, eventName, otherEvents, sophistication, currentNodeTitle, journeyStructure, lineageContent }) {
    const sharedContext = getSharedContextBlock({
        topicTitle: overallTopic,
        sophistication,
        currentNodeTitle,
        journeyStructure,
        lineageContent
    });

    return `You are an expert educator specializing in events and periods of history.

${sharedContext}

TASK:
Your task is to explain the specific event or period that a user clicked on: "${eventName}". For context, other related events on the timeline include: ${otherEvents}.

${DETAILED_JSON_FORMAT_INSTRUCTIONS}`;
}

export function getSyllabusPrompt(topic, sophistication, categories) {
    return `You are an expert, rigorous and intellectual curriculum designer who follows tasks they have been set with precision and speed. Your task is to devise a syllabus. In case a, the topic you are asked about already has a syllabus e.g. GCSE math graphs or SAT algebra. In this case you should use those syllabi as best you can, being rigorously comprehensive and MECE. In case b, you are asked about a topic in more abstract terms like "iranian history since 1800" or "chinese diplomacy". In this case your task is to design a unique syllabus for the topic "${topic}" for a "${sophistication}" audience.

Your response MUST be a single, valid JSON object with NO other text before or after it.Do NOT use unescaped newline characters.
The JSON object must have two required keys ("category", "syllabus") and one optional key ("visualAssets").

1.  **"category"**: Categorize this topic into ONE of the following predefined categories: ${categories.join(', ')}.
2.  **"syllabus"**: In case a, write a syllabus with 6-12 modules, which together are MECE. In case b, Design a syllabus as a numbered list of 4-8 unique and compelling module titles for the topic. In both cases this value must be a single string. The modules should be specific to the topic and in case b, not generic at all. Provide only the titles. Avoid generic titles like "Introduction" or "Key Concepts.", 'historical context'.
3.  **"visualAssets" (Optional)**:
    * **IF the topic's category is NOT "Science" or "Mathematics"** and is inherently historical and best understood chronologically, you MAY include this key. If you choose to include it, make it detailed e.g. aim for 9-10 events/periods, though more if the topic demands it. For instance if asked about chinese imperial history make sure to include all the dynasties, not just some.
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

export function getQuestionDispatcherPrompt({ topicTitle, sophistication, journeyStructure, lineageContent, userQuestion, currentNodeTitle, currentNodeHasCards }) {
    const sharedContext = getSharedContextBlock({
        topicTitle,
        sophistication,
        currentNodeTitle,
        journeyStructure,
        lineageContent
    });

    const secondaryChoiceInstruction = currentNodeHasCards ? '' : `
        - If you choose "explanation", you MUST also make a second choice for a "location" key:
          - "inline": Choose this if the user's question is a direct follow-up or expansion of the text in the current node.
          - "newNode": Choose this if the user's question is related but distinct enough to warrant its own new section in the learning journey.
    `;

    return `You are an expert curriculum designer. Your task is to analyze a user's question within their learning journey and determine the best way to answer it.

${sharedContext}

USER'S QUESTION: "${userQuestion}"

--- YOUR TASK ---
Analyze the user's question and choose the best response format. Your response MUST be a single, valid JSON object with the following structure:

{
  "responseType": "explanation" | "subtopics",
  "location": "inline" | "newNode" | null,
  "content": { ... }
}

1.  **Primary Choice: "responseType"**
    - "explanation": Choose this if the question is best answered with a detailed 2-3 paragraph explanation.
    - "subtopics": Choose this if the question is broad and better answered by breaking it down into 4-8 distinct sub-topic cards for the user to explore.

2.  **Secondary Choice: "location"** ${secondaryChoiceInstruction}

3.  **Provide the "content"**:
    - If "responseType" is "subtopics", the "content" object MUST be { "syllabus": "1. Sub-topic 1\\n2. Sub-topic 2..." }.
    - If "responseType" is "explanation", the value for the "content" key MUST BE a single JSON object. The rules for constructing THIS INNER OBJECT are as follows:
      --- START OF INNER OBJECT RULES ---
      ${DETAILED_JSON_FORMAT_INSTRUCTIONS}
      --- END OF INNER OBJECT RULES ---

Do not add any other text before or after the JSON object.`;
}
export function getVegaLiteSpecPrompt(userPrompt) {
    return `You are an expert data visualization assistant specializing in creating Vega-Lite (v5) specifications. Your task is to convert a user's natural language request into a single, valid Vega-Lite JSON object.

USER'S REQUEST: "${userPrompt}"

--- YOUR TASK ---

1.  **Analyze the Request:** Carefully read the user's request to understand all the desired components.
2.  **Generate Base Data:** Create the base data needed for the primary lines or points. For functions, use a "sequence" transform. For discrete points, use an inline "values" array.
3.  **Construct the Vega-Lite JSON:**
    - Your response MUST be ONLY the JSON object, with no other text.
    - Use a layered approach. The top-level spec must have a "layer" array.
    - Title the graph and axes appropriately.

4.  **CRITICAL RULE: Use Calculation, Not Hardcoding:** For any feature that is mathematically derived from another (e.g., intersections, tangent lines, areas between curves), you **MUST** use Vega-Lite's "transform" array with "calculate" expressions. **Do not pre-calculate the values and hardcode them.** The spec must be self-contained and reproducible. Start with base layers for the main lines, then add new layers that use transforms to create the derived graphics.

--- ADVANCED EXAMPLE: Shading the area between y=x and y=x+1 ---
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Shading the area between two lines.",
  "data": { "sequence": {"start": 0, "stop": 10, "step": 0.2}, "as": "x" },
  "layer": [
    {
      "mark": "line",
      "transform": [{ "calculate": "datum.x", "as": "y" }],
      "encoding": { "x": {"field": "x"}, "y": {"field": "y"} }
    },
    {
      "mark": "line",
      "transform": [{ "calculate": "datum.x + 1", "as": "y" }],
      "encoding": { "x": {"field": "x"}, "y": {"field": "y"} }
    },
    {
      "mark": {"type": "area", "opacity": 0.3},
      "transform": [
        { "calculate": "datum.x", "as": "lower_y" },
        { "calculate": "datum.x + 1", "as": "upper_y" }
      ],
      "encoding": {
        "x": {"field": "x", "type": "quantitative"},
        "y": {"field": "lower_y", "type": "quantitative", "title": "y-value"},
        "y2": {"field": "upper_y"}
      }
    }
  ]
}

Now, generate the complete and mathematically correct Vega-Lite JSON for the user's request.`;
}