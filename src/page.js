'use strict';

import * as d3 from 'd3';
import './page.css'



export function init() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const body = d3.select('body');
  const u = body.append('div').style('width', '100%').style('height', '20px').classed('pp', true);
  const l = body.append('div').style('width', '100%').style('top', '20px').style('height', `${height - 20}px`).classed('pp', true);

  u.append('div').classed('uh-title', true).text('du-treemap');


  const ret = {
    getLowerWidth : () => width,
    getLowerHeight : () => height - 20,
    getLowerD3 : () => l,
    addLink : (id, label, onClick) => {
      const linkDiv = u.append('div').attr('id', id).classed('uh-link', true).text(label);
      linkDiv.on('click', () => {
        if (linkDiv.classed('uh-link-selected')) {
          return;
        }
        onClick();
      });

      return {
        selected : selected => {
          linkDiv.classed('uh-link-selected', !!selected);
        }
      };
    },
    clearLower: () => {
      l.selectAll('*').remove();
      return ret;
    },
    clearLinkSelections: () => {
      u.selectAll('.uh-link').classed('uh-link-selected', false);
      return ret;
    }

  }
  return ret;
}
