import { Container as SVGContainer, G as SVGG } from "@svgdotjs/svg.js";
import { ISheet } from "../ISheet";

const sheet: ISheet = {
    name: "piecepack",
    // tslint:disable-next-line:object-literal-sort-keys
    description: "Core Piecepack graphics set",
    cellsize: 100,
    glyphs: new Map<string, (canvas: SVGContainer) => SVGG>(),
};

// Alphabetize by glyph name, please!
// The element's root `id` must be the same as its map key.
// If using groups to make complex glyphs, be sure to include the attribute `data-cellsize` (the greater of width and height) so the renderer can scale it properly.

sheet.glyphs.set("piecepack-misc-coin-back", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-misc-coin-back")
        .attr("data-cellsize", 680);
    group.rect(680, 680).fill({opacity: 0});
    group.path("M0,460c0,94,33.2,174.2,99.5,240.5S246,800,340,800s174.2-33.2,240.5-99.5S680,554,680,460c0-94.7-33-175-99-241 s-146.3-99-241-99s-175,33-241,99S0,365.3,0,460z M331,762c-82-2-151.5-32.3-208.5-91C65.5,612.3,37,542,37,460 c0-84,29.5-155.5,88.5-214.5S256,157,340,157s155.5,29.5,214.5,88.5S643,376,643,460c0,82-28.5,152.3-85.5,211 c-57,58.7-126.5,89-208.5,91V656h-18V762z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-misc-tile-back", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-misc-tile-back")
        .attr("data-cellsize", 733);
    group.rect(733, 733).fill({opacity: 0});
    group.path("M733,799.5v-732H0v732H733z M387,446.5c0,15.3-8.7,24.3-26,27c-11.3,1.3-21.3-0.7-30-6c-8.7-8.7-13-19.3-13-32 c0-18,8-31.3,24-40c-9.3,8-14,18-14,30c0,9.3,3.3,17.3,10,24s14.7,9,24,7c8-2.7,12-8,12-16c0-2-0.3-4.3-1-7l-2-3c0.7-0.7,2-1,4-1 C383,430.8,387,436.5,387,446.5z M16,82.5h348v299c-14.7,0-27.2,5.2-37.5,15.5S311,419.8,311,434.5H16V82.5z M717,436.5v348H366 v-295c14.7,0,27.3-5.3,38-16s16-23.3,16-38c0-29.3-14.3-47-43-53c28.7,6,43,23.7,43,53v1H717z M376,414.5c-14.7,0-21.3,5.3-20,16v4 c0.7,1.3,2,3.3,4,6h-1c0,0.7-0.3,1-1,1c-10,2.7-15-2.7-15-16c0-9.3,4-16.8,12-22.5s16.7-7.5,26-5.5c7.3,0.7,14.3,3.7,21,9 c6.7,8.7,10,18.3,10,29c0,17.3-7.7,30.7-23,40c8.7-8.7,13-18.7,13-30C402,426.8,393.3,416.5,376,414.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-0", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-0")
        .attr("data-cellsize", 800);
    group.rect(800, 800).fill({opacity: 0});
    group.path("M65.5,401c0,106,29.7,190.3,89,253s141.7,94,247,94c104.7,0,186.3-31.3,245-94s88-147,88-253c0-106.7-28.7-191-86-253 c-58.7-64-141-96-247-96c-105.3,0-187.7,31.7-247,95S65.5,295,65.5,401z M318.5,401c0-62.7,3.3-108.3,10-137 c13.3-40.7,37.7-61,73-61c39.3,0,64.3,25.3,75,76c4,19.3,6,60,6,122c0,64-2,104.7-6,122c-10,50-35,75-75,75 c-32,0-53.8-12.8-65.5-38.5S318.5,481,318.5,401z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-1", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-1")
        .attr("data-cellsize", 673);
    group.rect(673, 673).fill({opacity: 0});
    group.path("M175,456l-69,175l254,169h207V127H324v437L175,456z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-2", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-2")
        .attr("data-cellsize", 685);
    group.rect(685, 685).fill({opacity: 0});
    group.path("M333.5,277.5h275v-162h-532v189c60.7,29.3,126.3,66,197,110c61.3,38,92,79.3,92,124c0,62.7-41.7,94-125,94 c-32,0-82-9.7-150-29v175c70,13.3,141,20.3,213,21c87.3,0.7,156.7-13.7,208-43c64-37.3,96.3-96.3,97-177 c0.7-113.3-91-213.3-275-300V277.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-3", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-3")
        .attr("data-cellsize", 696);
    group.rect(696, 696).fill({opacity: 0});
    group.path("M168,380v147c18-1.3,36-2,54-2c36.7,0,63.7,2.7,81,8c32,6,48,22.3,48,49s-9.8,44.7-29.5,54S279,650,253,650 c-58.7,0-113-8.7-163-26v150c61.3,17.3,135,26,221,26c70,0,134.7-13.7,194-41c66.7-30.7,99.7-79.7,99-147 c-0.7-76.7-44-127.7-130-153v-2c94-22,140.3-73.7,139-155c-0.7-69.3-34.7-121.3-102-156c-52.7-28-117.3-42-194-42 c-84,0.7-162,10-234,28v157c45.3-18.7,102-28.3,170-29c29.3-0.7,52.7,2.3,70,9c25.3,10,38,27.3,38,52c-0.7,44-37.3,66-110,66 C223,387,195.3,384.7,168,380z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-4", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-4")
        .attr("data-cellsize", 673);
    group.rect(673, 673).fill({opacity: 0});
    group.path("M140,412h168v197L140,412z M542,422h118V256H542V127H308v129H13v226l288,318h241V422z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-5", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-5")
        .attr("data-cellsize", 686);
    group.rect(686, 686).fill({opacity: 0});
    group.path("M570,799.5v-156H316v-105c23.3,2.7,48.3,4,75,4c62-0.7,112.5-19.8,151.5-57.5s58.2-87.5,57.5-149.5 c-0.7-79.3-33.7-138-99-176c-52.7-30.7-122-45.7-208-45c-70,0.7-139,10.3-207,29v153c47.3-12.7,94.3-19.3,141-20 c12,0,26.7,1.3,44,4c51.3,8,77,32.3,77,73c0,32.7-14.7,55.3-44,68c-21.3,9.3-51,14-89,14c-40.7,0-81-5-121-15v379H570z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-6", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-6")
        .attr("data-cellsize", 697);
    group.rect(697, 697).fill({opacity: 0});
    group.path("M600.5,781.5v-155c-59.3,15.3-115,23-167,23c-71.3,0-118.7-23-142-69c-5.3-10-10.3-31.7-15-65c30.7,26.7,81,40.3,151,41 c66.7,0,122-19,166-57c46-40,69-93,69-159c-0.7-77.3-32-137.7-94-181c-55.3-38-123.3-56.7-204-56c-98,1.3-177.5,32.8-238.5,94.5 S34.5,339.5,34.5,437.5c0,112,32.2,200.3,96.5,265s152.5,97,264.5,97C480.2,799.5,548.5,793.5,600.5,781.5z M440.5,340.5 c0,59.3-27.7,88.7-83,88c-54-0.7-81-31.7-81-93c0-25.3,7.3-46.2,22-62.5c14.7-16.3,34.3-24.5,59-24.5c26.7,0,47.3,9,62,27 C433.5,291.5,440.5,313.2,440.5,340.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-7", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-7")
        .attr("data-cellsize", 673);
    group.rect(673, 673).fill({opacity: 0});
    group.path("M63,800h547V615L368,127H79l286,488H63V800z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-8", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-8")
        .attr("data-cellsize", 697);
    group.rect(697, 697).fill({opacity: 0});
    group.path("M164.5,457.5v2c-82,26-123,78-123,156c0,52.7,22.3,95,67,127c36.7,25.3,83.7,42.3,141,51c26,4,58.7,6,98,6c199.3,1.3,300-60,302-184c1.3-76-39-128.3-121-157v-1c92-22,138-76.3,138-163c0-70.7-37.7-122.3-113-155c-56-24-124.7-36-206-36 c-76.7,0-147,13.7-211,41c-32,13.3-57.3,33-76,59c-20.7,27.3-30.7,57.7-30,91C31.2,385.8,75.8,440.2,164.5,457.5z M274.5,598.5 c0-22.7,6.5-41.3,19.5-56s30.8-22.3,53.5-23c46-0.7,69,25,69,77c0,50.7-23,76-69,76c-22,0-39.7-6.8-53-20.5 S274.5,620.5,274.5,598.5z M273.5,331.5c0-59.3,24.7-89,74-89c50.7,0,76,30.3,76,91c0,57.3-25.3,86-76,86 C298.2,419.5,273.5,390.2,273.5,331.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-9", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-9")
        .attr("data-cellsize", 696);
    group.rect(696, 696).fill({opacity: 0});
    group.path("M95,123v155c63.3-15.3,119.3-23,168-23c41.3,0,77,9.7,107,29c19.3,12.7,35.7,47.7,49,105c-20.7-16.7-46.7-27.3-78-32 c-28.7-6-53.3-9-74-9c-65.3,0-120,19.3-164,58c-46,40.7-69,93-69,157c0,78,31,138.3,93,181c54,37.3,122,56,204,56 c99.3,0,179.3-30.7,240-92s91-141.7,91-241c0-112.7-32.3-201.3-97-266s-153-97-265-97C226.7,104,158.3,110.3,95,123z M255,563 c0-26,7.5-47.2,22.5-63.5s35.2-24.2,60.5-23.5c54,0.7,81,31.7,81,93c0,58-27,87-81,87c-26,0-46.3-8.8-61-26.5S255,589.7,255,563z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-number-void", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-number-void")
        .attr("data-cellsize", 670);
    group.rect(670, 670).fill({opacity: 0});
    group.path("M335,130.5c-92.7,0-171.7,32.5-237,97.5S0,371.8,0,464.5C0,557.8,32.5,637,97.5,702s144.2,97.5,237.5,97.5 S507.5,767,572.5,702S670,557.8,670,464.5c0-92.7-32.7-171.5-98-236.5S427.7,130.5,335,130.5z M126,661.5c-52-55.3-78-121-78-197 c0-50.7,12.7-98,38-142s60-79,104-105c-22.7,20-40.3,42-53,66v1l-1,2c-20,40-30,79-30,117c0,30,7.7,60.3,23,91 c34,67.3,83.3,101,148,101c51.3,0,86.3-20.7,105-62c6-13.3,9-26.7,9-40c0-11.3-3.3-25-10-41v-2l-13-17c6-4.7,15-6.3,27-5 c26,2.7,46.3,19,61,49c8,16.7,12,34,12,52c0,26-6.3,51-19,75c-28.7,55.3-75.7,87.3-141,96c-14.7,2-27.7,3-39,3 C217.7,703.5,170,689.5,126,661.5z M559,285.5c42,52.7,63,112.3,63,179c0,50.7-12.3,97.8-37,141.5s-59,78.8-103,105.5 c20-20.7,35.7-42.3,47-65v-1c20-40,30-78.7,30-116c0-31.3-7-62-21-92c-28-60.7-72.7-93.7-134-99c-42-4-75.7,6.7-101,32 c-18,18-27,40-27,66v9l2,10c3.3,9.3,10,21,20,35l2,4c-1.3,6.7-9.3,10-24,10c-26,0-48-17.3-66-52l-1-1c-8-15.3-12-31.3-12-48 c0-50.7,21.7-93.3,65-128c41.3-32.7,87.7-49,139-49C454.3,226.5,507,246.2,559,285.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-anchors", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-anchors")
        .attr("data-cellsize", 707);
    group.rect(707, 707).fill({opacity: 0});
    group.path("M446,345c10.7-2,21-3,31-3c66,0,121,31.3,165,94c6-14.7,9-29.7,9-45c0-76-68.7-158-206-246c-28-18-58-35.3-90-52l-2,6l-1-6 c-56,29.3-105.7,60-149,92C104.3,259,55,327.7,55,391c0,15.3,3,30.3,9,45c44.7-62.7,99.7-94,165-94c10.7,0,21.3,1,32,3l49,140 l-108,5c-16.7-14.7-36.3-22-59-22c-24.7,0-45.7,8.7-63,26s-26,38.3-26,63s8.7,45.7,26,63s38.3,26,63,26c32.7,0,58-14,76-42h84 l-4,36c-18.7,17.3-29.7,34.7-33,52v4c-1.3,4.7-2,9.7-2,15c0,24.7,8.7,45.7,26,63s38.3,26,63,26s45.8-8.7,63.5-26s26.5-38.3,26.5-63 c0-4.7-0.7-9.7-2-15l-1-4c-4.7-18.7-15.7-36-33-52l-3-36h84c17.3,28,42.7,42,76,42c24.7,0,45.7-8.7,63-26s26-38.3,26-63 s-8.7-45.7-26-63s-38.3-26-63-26c-22.7,0-42.7,7.3-60,22l-107-5L446,345z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-clubs", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-clubs")
        .attr("data-cellsize", 657);
    group.rect(657, 657).fill({opacity: 0});
    group.path("M657,437.5c0-41.3-13.7-76.2-41-104.5s-61.7-42.5-103-42.5c-71.3,0-128.3,41.7-171,125c0-42.7,3-75,9-97 c16.7-62,55.7-107,117-135c16-7.3,44.3-14.7,85-22v-18H104v18c37.3,6,66,13.3,86,22c60.7,26.7,99.3,72,116,136c6,23.3,9,55.3,9,96 c-40.7-83.3-97.3-125-170-125c-40.7,0-75,14.3-103,43s-42,63.3-42,104c0,42,11.7,77.2,35,105.5s55.7,42.5,97,42.5 c14,0,31-4.3,51-13l35-15c-24.7,36-37,69-37,99c0,40,14.3,73.8,43,101.5s63.3,41.5,104,41.5c42.7,0,78-13.3,106-40s42-61,42-103 c0-30.7-12.3-63.7-37-99l35,14c23.3,9.3,40.3,14,51,14c40,0,72-14.5,96-43.5S657,478.2,657,437.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-crowns", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-crowns")
        .attr("data-cellsize", 716);
    group.rect(716, 716).fill({opacity: 0});
    group.path("M670,470.5c0-15.3-2.3-32.3-7-51c-23.3-94.7-48.7-156-76-184l37-59v-10c0-23.3-7.8-43-23.5-59s-35.2-23.7-58.5-23l-183,5 l-185-5c-23.3-0.7-42.8,6.8-58.5,22.5S92,142.5,92,166.5v10l37,59c-27.3,28-52.7,89.3-76,184c-4.7,18.7-7,35.7-7,51 c0,72,41.3,108,124,108c22.7,0,48-3,76-9l4,15h-38v155h70v60h152v-60h70v-155h-37l3-15c28,6,53.3,9,76,9 C628.7,578.5,670,542.5,670,470.5z M601,434.5c3.3,13.3,5,25.3,5,36c0,30-20.3,45-61,45c-25.3,0-55.7-5-91-15l-32-9l-35,158h53v26 h-59l-11,51v9h-24v-9l-11-51h-59v-26h53l-34-158l-33,9c-36.7,10-67,15-91,15c-40.7,0-61-15-61-45c0-10.7,1.7-22.7,5-36 c20-79.3,39.3-130,58-152l89,44l-104-166c2-7.3,7.3-11,16-11l185,4l183-4c8.7,0,14.3,3.7,17,11l-104,166l89-44 C562,304.5,581,355.2,601,434.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-diamonds", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-diamonds")
        .attr("data-cellsize", 690);
    group.rect(690, 690).fill({opacity: 0});
    group.path("M349.5,800l264-343l-264-347l-273,347L349.5,800z M348.5,223l177,232l-178,234l-181-231L348.5,223z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-fleurdelis", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-fleurdelis")
        .attr("data-cellsize", 452);
    group.rect(452, 452).fill({opacity: 0});
    group.path("M384.1,614.5c12.4-10,18.6-22,18.6-36c0-18.4-13.8-40.6-41.4-66.6c0.4,6,0.6,11.6,0.6,16.8c0,30-7,45-21,45 c-15.2,0-35.8-15.8-61.8-47.4c-8.4-16.8-12.6-34.8-12.6-54l-0.6-2.4h22.2v-13.8h-44.4v-20.4c2.4-15.6,8.6-23.4,18.6-23.4 c11.6,0,26.2,9.2,43.8,27.6c0.8-6.8-0.2-14-3-21.6c-4.8-12.8-11.4-21-19.8-24.6c-16-6.8-27.4-7.2-34.2-1.2c0.8-5.2,1.2-10,1.2-14.4 c0-14.8-4.4-24.4-13.2-28.8v-1.2h-22.8v1.2c-8.8,4.4-13.2,14-13.2,28.8c0,4.4,0.6,9.2,1.8,14.4c-3.2-2.8-7.6-4.2-13.2-4.2 c-6,0-13.2,1.8-21.6,5.4c-6,6-12.4,14.2-19.2,24.6c-2.8,6.8-4,14-3.6,21.6c18-18.4,32.6-27.6,43.8-27.6c10,0,16.4,7.8,19.2,23.4 v20.4h-44.4v13.8h21.6v2.4c0,19.2-4.4,37.2-13.2,54c-26,31.6-46.6,47.4-61.8,47.4c-13.6,0-20.4-14.6-20.4-43.8 c0-5.6,0.2-11.6,0.6-18c-27.6,26-41.4,48.2-41.4,66.6c0,14.4,5.9,26.2,17.7,35.4c11.8,9.2,24.9,13.8,39.3,13.8 c34,0,59-19.2,75-57.6c8.8-21.6,15.6-55,20.4-100.2h6.6v39c0.4,4,0.6,8.2,0.6,12.6c0,20.8-5.6,50.8-16.8,90c-12,42-18.2,66-18.6,72 c-1.6,22.8,7,43.4,25.8,61.8c8.4,8.4,17,25.6,25.8,51.6v3l0.6-1.2l0.6,1.2v-3c8.8-26,17.4-43.2,25.8-51.6 c18.8-18.8,27.4-39.4,25.8-61.8c-1.2-16.4-7.4-43.2-18.6-80.4c-10.8-34.4-16.2-61.6-16.2-81.6c0-4.4,0.2-8.6,0.6-12.6v-39h6.6 c4.8,44.8,11.8,78,21,99.6c15.6,38.8,40.2,58.2,73.8,58.2C360.3,627.7,373.3,623.3,384.1,614.5z")
        .attr("data-playerfill", true)
        .flip("y")
        .dmove(0, -226)
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-hearts", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-hearts")
        .attr("data-cellsize", 671);
    group.rect(671, 671).fill({opacity: 0});
    group.path("M632.5,612c0-62-26.7-126-80-192l-91-113l-125-178l-19,27c-18,28-53.7,78-107,150l-90,114c-54.7,69.3-82,133.3-82,192 c0,56,14.8,101.3,44.5,136s72.2,52,127.5,52c50,0,91.7-17,125-51c33.3,34,75.7,51,127,51c55.3,0,98-18,128-54 C618.5,712.7,632.5,668,632.5,612z M499.5,464c44,53.3,66,102.7,66,148c0,34.7-8,62.7-24,84c-18,24-43.7,36-77,36 c-50.7,0-86-24.7-106-74c-9.3-24-17-36-23-36c-4.7,0-9,3.3-13,10l-10,26c-18.7,49.3-53.7,74-105,74c-33.3,0-59-12-77-36 c-16-21.3-24-49.3-24-84c0-43.3,22-92.7,66-148l85-107l78-106C383.5,319,438.2,390,499.5,464z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-moons", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-moons")
        .attr("data-cellsize", 645);
    group.rect(645, 645).fill({opacity: 0});
    group.path("M459,291c69.3,0,128,25.3,176,76c-23.3-64-62.5-115.3-117.5-154S401,155,333,155c-89.3,0-165.5,31.3-228.5,94 S10,387.7,10,477c0,90,31.3,166.3,94,229s139,94,229,94c40.7,0,80.7-7.7,120-23c-66.7-2-122.8-26.3-168.5-73S216,600.7,216,534 c0-68,23.5-125.5,70.5-172.5S391,291,459,291z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-spades", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-spades")
        .attr("data-cellsize", 683);
    group.rect(683, 683).fill({opacity: 0});
    group.path("M611,395c0-35.3-11.7-65-35-89s-52.7-36-88-36c-55.3,0-99,25.7-131,77c0-32,3.8-57.7,11.5-77s22.7-40.5,45-63.5 S459,167,483,157c18.7-8,46.3-15,83-21v-19H117v19c60.7,9.3,109.7,31,147,65c41.3,38,62,86.7,62,146c-32.7-51.3-76.3-77-131-77 c-36,0-65.5,11.8-88.5,35.5S72,359,72,395c0,34,13.7,68.7,41,104c15.3,19.3,42,46.3,80,81c46.7,42,78,74.3,94,97 c20.7,29.3,38.7,70.3,54,123c12-48,30.3-89,55-123c16.7-23.3,48-56,94-98c40.7-37.3,67.3-64,80-80C597.3,464.3,611,429.7,611,395z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-stars", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-stars")
        .attr("data-cellsize", 729);
    group.rect(729, 729).fill({opacity: 0});
    group.path("M729,517L504,354l86-266L365,252L139,88l88,266L0,517h280l84,266l87-266H729z M547,459H408l-44,133l-43-133H181l114-83 l-43-134l113,82l110-80l-41,131L547,459z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

sheet.glyphs.set("piecepack-suit-suns", (canvas: SVGContainer) => {
    const group = canvas.group()
        .id("piecepack-suit-suns")
        .attr("data-cellsize", 758);
    group.rect(758, 758).fill({opacity: 0});
    group.path("M757.5,410l-106-61c-9.3-34-24.3-65.3-45-94l36-106l-127,26c-26.7-15.3-56.3-25.7-89-31l-58-102l-62,107 c-32,8.7-62,22.7-90,42l-113-30l32,119c-16.7,28.7-28,60-34,94l-101,58l106,61c8.7,32.7,23,63,43,91l-30,113l118-32 c29.3,16.7,60.7,28,94,34l59,101l61-107c32-8.7,62-22.7,90-42l113,30l-32-119c16.7-28.7,28-60,34-94L757.5,410z M379.5,205 c60,0,111,21,153,63s63,93,63,153s-21,111-63,153s-93,63-153,63s-111-21-153-63s-63-93-63-153s21-111,63-153S319.5,205,379.5,205z")
        .attr("data-playerfill", true)
        .flip("y")
        .stroke({width: 5, color: "#000"})
        .fill("#000");
    return group;
});

export { sheet as PiecepackSheet };
