'use strict';

// see https://blog.phronemophobic.com/treemaps-are-awesome.html
// see https://observablehq.com/@d3/treemap/2
// see https://observablehq.com/@d3/zoomable-treemap
import * as d3 from 'd3';

// Sample data: checked out Python git repo
// du --apparent-size -b | grep -v './.git' > du-output.txt
import data from '../data/du-output.txt'

function loaded() {

  console.log(`data size: ${data.length}`);
  const tree = {
    name : '.',
    children: [],
    childMap: {},
    size : 0,
    sizeSi : 0
  };

  data.trim().split('\n').forEach(line => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) return;

    const size = parseInt(match[1], 10);
    const pathElements = match[2].split('/');

    var tn = tree;
    for (var i = 1; i < pathElements.length; i++) {
      const pe = pathElements[i];
      if (!tn.childMap[pe]) {
        const newChild = {
          name : pe,
          children : [],
          childMap : {},
          size : 0,
          sizeSi : 0
        };
        tn.childMap[pe] = newChild;
        tn.children.push(newChild)
      }
      tn = tn.childMap[pe];
    }
    tn.size = size; // du uses kB by default, instruct it with -b to use bytes
    tn.sizeSi = formatSi(tn.size);
  });
  console.log('Directory size tree', tree);

  // filter for max 2 levels
  function traverse(renderSize, minRenderSize, descends, fromRoot) {
    const toRoot = {
      name : fromRoot.name,
      children : [],
      size : fromRoot.size
    };
    if (descends > 0) {
      var unrenderedSize = 0;
      var unrenderedCount = 0;
      var renderedCount = 0;
      for (var child of fromRoot.children) {
        const childRenderSize = renderSize * child.size / fromRoot.size;

        if (childRenderSize < minRenderSize) {
           unrenderedSize = unrenderedSize + child.size;
           unrenderedCount = unrenderedCount + 1;
        } else {
          const newChild = traverse(childRenderSize, minRenderSize, descends-1, child, newChild);
          toRoot.children.push(newChild);
          renderedCount = renderedCount + 1;
        }
      }
      if (unrenderedCount > 0 && renderedCount > 0) {
        toRoot.children.push({
          name : `... (${unrenderedCount} more)`,
          size : unrenderedSize,
          children : [],
          unrenderedPlaceholder : true
        });
      }
    }
    return toRoot;
  }
  const filtered_tree = traverse(1000000, 50, 5, tree);




  // based on https://observablehq.com/@d3/treemap/2
  const width = window.innerWidth; // 1154;
  const height = window.innerHeight; //  1154;

  // Specify the color scale.
  const color = d3.scaleOrdinal(tree.children.map(d => d.name), d3.schemeTableau10);

  const tiling = d3.treemapSquarify; // d3.treemapBinary d3.treemapSquarify d3.treemapSliceDice d3.treemapSlice d3.treemapDice

   // Compute the layout.
  const root = d3.treemap()
    .tile(tiling)
    .size([width, height])
    .padding(1)
    .round(true)
  (d3.hierarchy(filtered_tree)
      .sum(d => !!d.children.length ? 0 : d.size)
      .sort((a, b) => {
           if (a.data.unrenderedPlaceholder || a.data.unrenderedPlaceholder) {
            return (a.data.unrenderedPlaceholder ? 1 : 0) - (b.data.unrenderedPlaceholder ? 1 : 0); // reversed, unrendered placeholders to the end
           } else {
            return b.value - a.value;
           }
      })); // called on node, not on data


   // Create the SVG container.
  const svg = d3.select('body').append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add a cell for each leaf of the hierarchy.
  const leaf = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  // Append a tooltip.
  const format = d3.format(",d");
  leaf.append("title")
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join("/")}\n${formatSi(d.value)} (${format(d.value)})`);

  // Example used ObservableHQs uid(....)
  // limits: return is not a function, href is relative
  var idCt = 0;
  function newId(prefix) {
    prefix = !!prefix ? prefix : 'seq-id'
    const ret = {
      id : `${prefix}-${idCt}`,
      href : `#${prefix}-${idCt}`
    };
    idCt = idCt + 1;
    return ret;
  }

  // Append a color rectangle.
  leaf.append("rect")
    .attr("id", d => (d.leafId = newId('leaf')).id)
    .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
    .attr("fill-opacity", d => d.data.unrenderedPlaceholder ? 0.4 : 0.6)
    .attr("width", d => d.w = d.x1 - d.x0)
    .attr("height", d => d.h = d.y1 - d.y0);

  const textedLeaf = leaf.filter(d => d.w > 15 && d.h > 10);
  textedLeaf.append("clipPath")
    .attr("id", d => (d.clipId = newId("clip")).id)
    .append("use")
      .attr("xlink:href", d => d.leafId.href);

  // Append multiline text. The last line shows the value and has a specific formatting.
  textedLeaf.append("text")
    .attr("clip-path", d => `url(${d.clipId.href})`)
    .selectAll("tspan")
    .data(d => [ d.data.name, formatSi(d.value) ])
    .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
      .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.6 : null)
      .text(d => d);

}

function formatSi(bytes, decimals = 2) {
  if (bytes < 0) return '' + bytes;

  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let unitIndex = 0;

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }

  return `${bytes.toFixed(decimals)} ${units[unitIndex]}`;
}


document.addEventListener('DOMContentLoaded', loaded);
