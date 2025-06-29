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
