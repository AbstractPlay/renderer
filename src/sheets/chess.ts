import { Container as SVGContainer, G as SVGG } from "@svgdotjs/svg.js";
import { ISheet } from "../ISheet";

const sheet: ISheet = {
    name: "chess",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "Various chess sets based on freely available fonts",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGG>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("chess-bishop-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1756 3140l291 -290l291 291l-290 291zM1374 3141l673 673l674 -674l-673 -673zM1436 1980v-1432h1223v1432h-1223zM1159 2252h1777v-1982h-1777v1982z")
        .rotate(180)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-bishop-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1639 922v354l-120 64l-174 -93l124 -66v-259l-1 -512h-888v511v253l630 333l-186 99l-615 -332v-353v-682h1230v683zM341 921v410l684 365l347 -185l-725 -383v-207v-263v-180h754v184v259v207l-222 117l345 185l182 -99v-409v-262v-489h-1365v487v263z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-bishop-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 100q-8 0 -14 6t-6 14t6 14t14 6t14 -6t6 -14t-6 -14t-14 -6zM500 900q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM480 823q11 -3 20 -3q11 0 20 3l23 -23l-140 -140l77 -77l140 140l134 -134q12 -12 12 -20q0 -9 -12 -9h-222l-32 -32l-32 32h-222q-12 0 -12 9q0 8 12 20zM520 177q-9 3 -20 3q-9 0 -20 -3l-23 23l140 140l-77 77l-140 -140l-134 134q-12 12 -12 20q0 9 12 9h222l32 32l32 -32h222q12 0 12 -9q0 -8 -12 -20zM237 520h215l20 -20l-20 -20h-215l-20 20zM763 480h-215l-20 20l20 20h215l20 -20zM449 151q-9 -13 -9 -31q0 -25 17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5q0 18 -9 31l232 232q30 29 30 56q0 14 -9 25l36 36l-36 37q9 10 9 24q0 27 -30 56l-163 163l-140 -140l-20 20l140 140l-49 49q9 14 9 31q0 25 -17.5 42.5t-42.5 17.5t-42.5 -17.5t-17.5 -42.5q0 -17 9 -31l-232 -232q-30 -30 -30 -56q0 -14 9 -25l-36 -36l36 -36q-9 -10 -9 -24q0 -27 30 -57l163 -163l140 140l20 -20l-140 -140z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-bishop-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1159 2252h1777v-1982h-1777v1982zM1374 3141l673 673l674 -674l-673 -673z")
        .rotate(180)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-bishop-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M341 921v410l684 365l347 -185l-725 -383v-207v-263v-180h754v184v259v207l-222 117l345 185l182 -99v-409v-262v-489h-1365v487v263z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-bishop-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-bishop-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M780 380q41 41 41 66q0 13 -13 22l32 32l-32 32q13 9 13 23q0 24 -41 65l-140 140l-160 -160l-40 40l160 160l-49 49q9 14 9 31q0 25 -17.5 42.5t-42.5 17.5t-42.5 -17.5t-17.5 -42.5q0 -17 9 -31l-229 -229q-41 -41 -41 -65q0 -14 13 -23l-32 -32l32 -32q-13 -9 -13 -22q0 -25 41 -66l141 -139l159 159l40 -40l-159 -159l20 -20l29 -28q-10 -14 -10 -33q0 -25 17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5q0 18 -9 33zM460 500l-20 -20h-180l-20 20l20 20h180zM540 500l20 20h180l20 -20l-20 -20h-180zM500 900q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 140q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-ex-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-ex-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M825 1117l931 932l-930 931l-1 296l289 -2l933 -933l934 935h290v-297l-931 -931l931 -929v-299h-285l-938 936l-932 -936h-291v297z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-ex-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-ex-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1024 878l-556 -555l-146 146l555 556l-555 555l146 146l555 -556l555 556l147 -147l-555 -555l555 -555l-146 -146z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M2048 3348h-612v271h477v207h270v-207h476v-271h-611zM2773 1844l622 954h-2698l626 -954h1450zM2936 1570h-1777l-966 1499h3710zM1913 2591h270v-471h-270v471zM1792 2120l-324 -1l-333 470h330zM2304 2120l330 471l327 -1l-323 -470h-334zM1436 1027v-479h1223v479 h-1223zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1470 855l-2 -445h-888v450l445 232zM1178 1399v-93l528 -282v-853h-1365v853l530 280v95h-291v307h291v171h307v-171h290v-307h-290zM1401 820l-374 199l-380 -199v-342h754v342zM1110 1264l-1 203h292v171h-292v171h-170v-171h-292v-171h292l-1 -205l-529 -284v-739 h1230v744z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 560q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5zM320 500q0 -18 5 -40h-165v40v40h165q-5 -22 -5 -40zM342 415q25 -47 73 -74q-6 -50 -20.5 -95t-35.5 -77.5t-46.5 -50.5t-52.5 -18q-32 0 -61.5 12.5t-51.5 34.5t-34.5 51.5t-12.5 61.5q0 55 68.5 98t173.5 57zM658 415q106 -14 174 -57t68 -98q0 -32 -12.5 -61.5t-34.5 -51.5t-51.5 -34.5t-61.5 -12.5q-27 0 -52.5 18t-46.5 50.5t-35.5 77t-20.5 95.5q49 27 73 74zM880 500v80h-101q75 29 118 70.5t43 89.5q0 41 -15.5 77.5t-43 64t-64 43t-77.5 15.5q-48 0 -90 -43t-70 -117v100h-80h-80v-100q-27 74 -69.5 117t-90.5 43q-41 0 -77 -15.5t-64 -43t-43.5 -64t-15.5 -77.5q0 -48 43 -89.5t118 -70.5h-101v-80v-80h101q-75 -28 -118 -70t-43 -90q0 -41 15.5 -77t43.5 -64t64 -43.5t77 -15.5q48 0 90.5 43t69.5 117v-100h80h80v100q28 -74 70 -117t90 -43q41 0 77.5 15.5t64 43.5t43 64t15.5 77q0 48 -43 90t-118 70h101v80zM500 160h-40v124v40q26 -4 40 -4t40 4v-40v-124h-40zM680 500q0 18 -5 40h165v-40v-40h-165q5 22 5 40zM360 500q0 58 41 99t99 41t99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99zM500 840h40v-124v-40q-26 4 -40 4t-40 -4v40v124h40zM658 585q-24 47 -73 74q6 50 20.5 95t35.5 77.5t46.5 50.5t52.5 18q32 0 61.5 -12.5t51.5 -34.5t34.5 -51.5t12.5 -61.5q0 -55 -68 -98t-174 -57zM342 585q-105 14 -173.5 57t-68.5 98q0 32 12.5 61.5t34.5 51.5t51.5 34.5t61.5 12.5q27 0 52.5 -18t46.5 -50.5t35.5 -77t20.5 -95.5q-48 -27 -73 -74z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M2048 3348h-612v271h477v207h270v-207h476v-271h-611zM1159 1298h1777v-1028h-1777v1028zM2392 2096h369l356 518l-360 2zM1703 2096l-361 518h-363l367 -518h357zM1900 2616v-520h297v520h-297zM2936 1570h-1777l-966 1499h3710z")
        .rotate(180)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1178 1399v-93l528 -282v-853h-1365v853l530 280v95h-291v307h291v171h307v-171h290v-307h-290zM1401 820l-374 199l-380 -199v-342h754v342z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-king-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-king-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M397 353q16 -11 31 -18q-19 -87 -65 -141t-103 -54q-50 0 -85 35t-35 85q0 57 54 103t141 66q5 -15 17 -32q-74 -11 -123 -49t-49 -88q0 -33 23.5 -56.5t56.5 -23.5q50 0 88 49t49 124zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5zM665 429q87 -20 141 -66t54 -103q0 -50 -35 -85t-85 -35q-57 0 -103 54t-65 141q15 7 31 18q11 -75 49 -124t88 -49q33 0 56.5 23.5t23.5 56.5q0 50 -49 88t-123 49q12 17 17 32zM647 603q75 11 124 49t49 88q0 33 -23.5 56.5t-56.5 23.5q-50 0 -88 -49t-49 -124q-12 9 -31 18q19 87 65 141t103 54q50 0 85 -35t35 -85q0 -57 -54 -103t-141 -65q-9 19 -18 31zM397 647q-11 75 -49 124t-88 49q-33 0 -56.5 -23.5t-23.5 -56.5q0 -50 49 -88t124 -49q-9 -12 -18 -31q-86 19 -139.5 65t-53.5 103q0 49 35 84.5t83 35.5q57 0 103 -54t66 -141q-18 -8 -32 -18zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM440 811q-36 61 -82 95t-98 34q-41 0 -77 -15.5t-64 -43t-43.5 -64t-15.5 -77.5q0 -52 34 -98t95 -82h-69v-120h69q-61 -36 -95 -82t-34 -98q0 -41 15.5 -77t43.5 -64t64 -43.5t77 -15.5q52 0 98 34t82 95v-69h120v69q36 -61 82.5 -95t97.5 -34q41 0 77.5 15.5t64 43.5t43 64t15.5 77q0 52 -34 98t-95 82h69v120h-69q61 36 95 82t34 98q0 41 -15.5 77.5t-43 64t-64 43t-77.5 15.5q-51 0 -97.5 -34t-82.5 -95v69h-120v-69z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M2014 2867q185 0 185 -185t-185 -185q-184 0 -184 185t184 185zM3031 1155h-271v734l-394 395l268 120l398 -399zM3562 549v-279h-2384l-2 278l549 1174l-767 -280l-431 924l1488 1042l-214 216l196 196l1565 -1576v-1695zM2095 1860l-612 -1312h1809l1 1587l-1075 1075 l-1341 -938l223 -479l1059 386l95 -260z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1639 1422v216h-1230v-171h911l-911 -485v-743h1230v748l-410 215zM1706 1706v-323l-334 -180l334 -179v-853h-1365v853l708 375h-708v307h1365zM1470 855l-2 -445h-888v450l445 232zM1024 1020l-377 -200v-342h754v342z")
        .rotate(180).flip("y").dmove(0, -100)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M420 200q8 0 14 6t6 14t-6 14t-14 6t-14 -6t-6 -14t6 -14t14 -6zM580 800q-8 0 -14 -6t-6 -14t6 -14t14 -6t14 6t6 14t-6 14t-14 6zM468 440l32 32l32 -32h168l-104 -65q-34 16 -67 20.5t-49 4.5l-20 -40q10 0 32 -1.5t52.5 -9.5t53 -24.5t22.5 -44.5h60q45 -30 45 -60t-45 -60h-300v-60q-10 4 -32.5 16t-52.5 38.5t-52.5 68.5t-22.5 97q0 6 1 20.5t4.5 35t12 39t22.5 25.5h208zM532 560l-32 -32l-32 32h-168l104 65q34 -16 67 -20.5t49 -4.5l20 40q-10 0 -32 2t-52.5 9.5t-53 24.5t-22.5 44h-60q-45 30 -45 60t45 60h300v60q10 -4 32.5 -16t52.5 -38.5t52.5 -68.5t22.5 -97q0 -6 -1 -20.5t-4.5 -35t-12 -39t-22.5 -25.5h-208zM548 480l-20 20l20 20h212l20 -20l-20 -20h-212zM452 520l20 -20l-20 -20h-212l-20 20l20 20h212zM160 500l60 -60q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -56 24.5 -104.5t62.5 -85t79 -59.5t74 -31v80h280q36 15 55.5 42t19.5 58t-19.5 58.5t-55.5 41.5h-60q0 14 -8 27l148 93l60 60l-60 60q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 56 -24.5 104.5t-62.5 85t-79 59.5t-74 31v-80h-280q-36 -14 -55.5 -41.5t-19.5 -58.5t19.5 -58t55.5 -42h60q0 -14 8 -27l-148 -93z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M3113 1196l1 850l-398 398l-268 -119l394 -395v-734h271zM1953 2914q-170 0 -170 -170t170 -170q171 0 171 170t-171 170zM1627 3137q42 10 96 47q49 34 77 73l215 151l-214 216l196 196l1565 -1572v-1978l-2385 1v289l548 1162l-767 -280l-431 924z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1024 1020l-377 -200v-342h754v342zM1706 1706v-323l-334 -180l334 -179v-853h-1365v853l708 375h-708v307h1365z")
        .rotate(180).flip("y").dmove(0, -100)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-knight-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-knight-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M631 347l149 93l60 60l-60 60q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 56 -24.5 104.5t-62.5 85t-79 59.5t-74 31v-80h-280q-36 -14 -55.5 -41.5t-19.5 -58.5t19.5 -58t55.5 -42h60q0 -13 9 -27l-149 -93l-60 -60l60 -60q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -56 24.5 -104.5t62.5 -85t79 -59.5t74 -31v80h280q36 15 55.5 42t19.5 58t-19.5 58.5t-55.5 41.5h-60q0 14 -9 27zM460 360l20 40zM300 440q-14 -7 -22.5 -25.5t-12 -39t-4.5 -35t-1 -20.5q0 -48 17 -83t39.5 -56t39 -29.5t24.5 -11.5v-40q-10 4 -32.5 16t-52.5 38.5t-52.5 68.5t-22.5 97q0 6 1 20.5t4.5 35t12 39t22.5 25.5h40zM605 370l-20 -40q-23 14 -55.5 22t-69.5 8l20 40q37 0 69.5 -8t55.5 -22zM395 630l20 40q23 -14 55.5 -22t69.5 -8l-20 -40q-37 0 -69.5 8t-55.5 22zM740 560h-40q14 7 22.5 25.5t12 39t4.5 35t1 20.5q0 48 -17 83t-39.5 56t-39 30t-24.5 11v40q10 -4 32.5 -16t52.5 -38.5t52.5 -68.5t22.5 -97q0 -6 -1 -20.5t-4.5 -35t-12 -39t-22.5 -25.5zM420 200q-8 0 -14 6t-6 14t6 14t14 6t14 -6t6 -14t-6 -14t-14 -6zM580 800q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM780 500l-20 -20h-200l-20 20l20 20h200zM220 500l20 20h200l20 -20l-20 -20h-200z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1159 1298h1777v-1028h-1777v1028zM1436 1027v-479h1223v479h-1223zM1842 2255v-414h412v414h-412zM1572 2526h952v-956h-952v956z")
        .rotate(180).dmove(0, -1250)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1470 855q-1 -111 -1.5 -222.5t-0.5 -222.5h-444h-444v224.5v225.5q111 57 222.5 115.5t222.5 116.5q111 -60 222 -119t223 -118zM1639 983l-612 326l-618 -331v-739h1230v744zM341 1024l686 364l679 -364v-853h-1365v853zM1025 1020q-95 -50 -189.5 -100t-188.5 -100 v-171.5v-170.5h376.5h377.5v170.5v171.5q-95 50 -189 100t-187 100z")
        .rotate(180).flip("y").dmove(0, -450)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 680q37 0 69.5 -14t57.5 -39t39 -57.5t14 -69.5t-14 -69.5t-39 -57.5t-57.5 -39t-69.5 -14t-69.5 14t-57.5 39t-39 57.5t-14 69.5t14 69.5t39 57.5t57.5 39t69.5 14zM500 600q41 0 70.5 -29.5t29.5 -70.5t-29.5 -70.5t-70.5 -29.5t-70.5 29.5t-29.5 70.5t29.5 70.5t70.5 29.5zM500 640q-58 0 -99 -41t-41 -99t41 -99t99 -41t99 41t41 99t-41 99t-99 41zM500 720q-45 0 -85 -17t-70.5 -47.5t-47.5 -70.5t-17 -85t17 -85t47.5 -70.5t70.5 -47.5t85 -17t85 17t70.5 47.5t47.5 70.5t17 85t-17 85t-47.5 70.5t-70.5 47.5t-85 17z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1159 1298h1777v-1028h-1777v1028zM1572 2526h952v-956h-952v956z")
        .rotate(180).dmove(0, -1250)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M341 1024l686 364l679 -364v-853h-1365v853zM1025 1020l-378 -200v-342h754v342z")
        .rotate(180).flip("y").dmove(0, -450)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-pawn-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-pawn-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 620q-50 0 -85 -35t-35 -85t35 -85t85 -35t85 35t35 85t-35 85t-85 35zM500 660q32 0 61.5 -12.5t51.5 -34.5t34.5 -51.5t12.5 -61.5t-12.5 -61.5t-34.5 -51.5t-51.5 -34.5t-61.5 -12.5t-61.5 12.5t-51.5 34.5t-34.5 51.5t-12.5 61.5t12.5 61.5t34.5 51.5t51.5 34.5t61.5 12.5zM500 720q-45 0 -85 -17t-70.5 -47.5t-47.5 -70.5t-17 -85t17 -85t47.5 -70.5t70.5 -47.5t85 -17t85 17t70.5 47.5t47.5 70.5t17 85t-17 85t-47.5 70.5t-70.5 47.5t-85 17z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M2048 2120h-285l285 488l281 -488h-281zM3282 2622l-802 -218l-432 749l-431 -747l-802 214l508 -776h1450zM3905 3068l-969 -1498h-1777l-965 1498l1291 -349l563 975l564 -973zM1436 1027v-479h1223v479h-1223zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1470 855l-2 -445h-888v450l445 232zM1176 1467l225 121v289h305v-494l-336 -179l336 -180v-853h-1365v853l339 178l-339 181v494h306v-289l225 -119l-1 408h306zM1401 820l-376 200l-378 -200v-342h754v342zM1639 987l-410 215l410 222v385h-171v-260l-359 -193v453 h-170v-453l-359 193v260h-171l1 -385l409 -222l-409 -215l-1 -748h1230v748z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 560q-25 0 -42.5 -17.5t-17.5 -42.5t17.5 -42.5t42.5 -17.5t42.5 17.5t17.5 42.5t-17.5 42.5t-42.5 17.5zM500 600q41 0 70.5 -29.5t29.5 -70.5t-29.5 -70.5t-70.5 -29.5t-70.5 29.5t-29.5 70.5t29.5 70.5t70.5 29.5zM500 640q-58 0 -99 -41t-41 -99t41 -99t99 -41t99 41t41 99t-41 99t-99 41zM273 710q-17 -10 -33 -10q-25 0 -42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5q0 -16 -10 -33l140 -57l54 132q-19 5 -31.5 21t-12.5 37q0 25 17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5q0 -21 -12.5 -37t-31.5 -21l54 -132l140 57q-10 17 -10 33q0 25 17.5 42.5t42.5 17.5t42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5q-16 0 -33 10l-57 -139l132 -55q5 19 21 31.5t37 12.5q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5q-21 0 -37 12.5t-21 31.5l-132 -55l57 -139q17 10 33 10q25 0 42.5 -17.5t17.5 -42.5t-17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5q0 16 10 33l-140 57l-54 -132q19 -5 31.5 -21t12.5 -37q0 -25 -17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5q0 21 12.5 37t31.5 21l-54 132l-103 -42l-37 -15q10 -17 10 -33q0 -25 -17.5 -42.5t-42.5 -17.5t-42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5q16 0 33 -10l57 139l-132 55q-5 -19 -21 -31.5t-37 -12.5q-25 0 -42.5 17.5t-17.5 42.5t17.5 42.5t42.5 17.5q21 0 37 -12.5t21 -31.5l132 55zM960 500q0 41 -29.5 70.5t-70.5 29.5q-22 0 -42 -9.5t-34 -25.5l-62 26l30 69h8q41 0 70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5v-8l-70 -30l-26 62q17 14 26.5 34t9.5 42q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5q0 -22 9.5 -42t26.5 -34l-26 -62l-70 30v8q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5h8l30 -69l-62 -26q-14 16 -34 25.5t-42 9.5q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5q22 0 42 9.5t34 25.5l62 -26l-30 -69h-8q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5v8l70 30l26 -62q-17 -14 -26.5 -34t-9.5 -42q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5q0 22 -9.5 42t-26.5 34l26 62l70 -30v-8q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5h-8l-30 69l62 26q14 -16 34 -25.5t42 -9.5q41 0 70.5 29.5t29.5 70.5z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1159 1298h1777v-1028h-1777v1028zM3905 3068l-969 -1498h-1777l-965 1498l1291 -349l563 975l564 -973zM2048 2120h281l-281 488l-285 -488h285z")
        .rotate(180)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1176 1467l225 121v289h305v-494l-336 -179l336 -180v-853h-1365v853l339 178l-339 181v494h306v-289l225 -119l-1 408h306zM1401 820l-376 200l-378 -200v-342h754v342z")
        .rotate(180).flip("y")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-queen-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-queen-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M500 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM140 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM240 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 160q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 260q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM860 520q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM760 780q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM500 880q8 0 14 -6t6 -14t-6 -14t-14 -6t-14 6t-6 14t6 14t14 6zM960 500q0 41 -29.5 70.5t-70.5 29.5q-22 0 -42 -9.5t-34 -25.5l-62 26l30 69h8q41 0 70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5v-8l-70 -30l-26 62q17 14 26.5 34t9.5 42q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5q0 -22 9.5 -42t26.5 -34l-26 -62l-70 30v8q0 41 -29.5 70.5t-70.5 29.5t-70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5h8l30 -69l-62 -26q-14 16 -34 25.5t-42 9.5q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5q22 0 42 9.5t34 25.5l62 -26l-30 -69h-8q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5v8l70 30l26 -62q-17 -14 -26.5 -34t-9.5 -42q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5q0 22 -9.5 42t-26.5 34l26 62l70 -30v-8q0 -41 29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5h-8l-30 69l62 26q14 -16 34 -25.5t42 -9.5q41 0 70.5 29.5t29.5 70.5zM500 640q58 0 99 -41t41 -99t-41 -99t-99 -41t-99 41t-41 99t41 99t99 41zM500 600q-41 0 -70.5 -29.5t-29.5 -70.5t29.5 -70.5t70.5 -29.5t70.5 29.5t29.5 70.5t-29.5 70.5t-70.5 29.5z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-outline-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-outline-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M1436 1027v-479h1223v479h-1223zM1159 1298h1777v-1028h-1777v1028zM2048 2255h-135v543h-477v-543h-277v543h-476v-957h2729v957h-476v-543h-277v543h-476v-543h-135zM406 3076h3277v-1506h-3277v1506z")
        .rotate(180).dmove(0, -800)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-outline-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-outline-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M341 1024l339 179l-339 180v323h306v-118l381 -200l373 200v118h305v-323l-334 -180l334 -179v-853h-1365v853zM1024 1020l-377 -200v-342h754v342zM1470 855l-2 -445h-888v450l445 232zM580 1549v89h-171l1 -214l409 -222l-409 -215l-1 -748h1230v748l-410 215l410 222 v214h-171v-89l-444 -238l-440 236z")
        .rotate(180).flip("y").dmove(0, -200)
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-outline-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-outline-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M274 580h-83q22 84 83.5 145.5t145.5 84.5v-83q-51 -18 -89.5 -57t-56.5 -90zM274 420q18 -51 56.5 -89.5t89.5 -56.5v-84q-84 23 -145.5 85t-83.5 145h83zM696 540h61q3 -19 3 -40q0 -20 -3 -40h-61q-12 -58 -55 -101t-101 -55v-61q-19 -3 -40 -3q-20 0 -40 3v61q-58 12 -101 55t-55 101h-61q-3 20 -3 40q0 21 3 40h61q12 58 55 101t101 55v61q20 3 40 3q21 0 40 -3v-61q58 -12 101 -55t55 -101zM858 540q-7 61 -34 116.5t-70 98.5t-98 69.5t-116 33.5v-61q-19 3 -40 3q-20 0 -40 -3v61q-61 -7 -116 -33.5t-98 -69.5t-70 -98t-34 -117h61q-3 -19 -3 -40q0 -20 3 -40h-61q7 -61 34 -116t70 -98t98 -70t116 -34v61q20 -3 40 -3q21 0 40 3v-61q61 7 116 34t98 70t70 98t34 116h-61q3 20 3 40q0 21 -3 40h61zM580 274q51 18 89.5 56.5t56.5 89.5h84q-22 -84 -84 -145.5t-146 -84.5v84zM580 727v83q84 -23 146 -84.5t84 -145.5h-84q-18 51 -56.5 90t-89.5 57z")
        .attr("data-playerfill", true)
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-solid-line", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-solid-line")
        .attr("data-cellsize", 4096);
    group.rect(4096, 4096).fill({opacity: 0});
    group.path("M2762 2798v-678h345v678h-345zM1877 2798v-678h341v678h-341zM988 2798v-678h345v678h-345zM406 3076h3277v-1506h-3277v1506zM1159 1298h1777v-1028h-1777v1028z")
        .rotate(180).dmove(0, -800)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-solid-millenia", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-solid-millenia")
        .attr("data-cellsize", 2048);
    group.rect(2048, 2048).fill({opacity: 0});
    group.path("M1024 1020l-377 -200v-342h754v342zM341 1024l339 179l-339 180v323h306v-118l381 -200l373 200v118h305v-323l-334 -180l334 -179v-853h-1365v853z")
        .rotate(180).flip("y").dmove(0, -200)
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("chess-rook-solid-montreal", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("chess-rook-solid-montreal")
        .attr("data-cellsize", 1000);
    group.rect(1000, 1000).fill({opacity: 0});
    group.path("M858 540q-7 61 -34 116.5t-70 98.5t-98 69.5t-116 33.5v-61q-19 3 -40 3q-20 0 -40 -3v61q-61 -7 -116 -33.5t-98 -69.5t-70 -98t-34 -117h61q-3 -19 -3 -40q0 -20 3 -40h-61q7 -61 34 -116t70 -98t98 -70t116 -34v61q20 -3 40 -3q21 0 40 3v-61q61 7 116 34t98 70t70 98t34 116h-61q3 20 3 40q0 21 -3 40h61zM420 727q-51 -18 -89.5 -57t-56.5 -90h-83q7 24 13 40h43q21 44 55 78t78 55v43q15 7 40 14v-83zM420 274v-84q-25 7 -40 14v44q-43 20 -77.5 54t-55.5 78h-43q-6 16 -13 40h83q18 -51 56.5 -89.5t89.5 -56.5zM580 274q51 18 89.5 56.5t56.5 89.5h84q-3 -14 -13 -40h-44q-20 -43 -54.5 -77.5t-78.5 -55.5v-43q-15 -7 -40 -14v84zM726 580q-18 51 -56.5 90t-89.5 57v83q24 -7 40 -13v-44q43 -20 77.5 -54.5t55.5 -78.5h44q6 -16 13 -40h-84z")
        .attr("data-playerfill", true)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

export { sheet as ChessSheet };
