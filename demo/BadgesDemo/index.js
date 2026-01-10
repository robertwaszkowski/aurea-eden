import { Diagram } from "../../lib/diagrams/Diagram.js";
import { Element } from "../../lib/elements/Element.js";
import { RectangleShape } from "../../lib/shapes/paths/RectangleShape.js";
import { RoundedRectangleShape } from "../../lib/shapes/paths/RoundedRectangleShape.js";
import { CircleShape } from "../../lib/shapes/paths/CircleShape.js";
import badgeUrl from "../../assets/badge.png";
import starUrl from "../../assets/star.gif";
import starSilverUrl from "../../assets/star_silver.gif";

const checkIcon = '<svg viewBox="0 0 24 24"><path fill="#4CAF50" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>';
const alertIcon = '<svg viewBox="0 0 24 24"><path fill="#F44336" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2Z"/></svg>';
const infoIcon = '<svg viewBox="0 0 24 24"><path fill="#2196F3" d="M11,9H13V7H11V9M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/></svg>';

export default (container) => {
    const diagram = new Diagram(container);

    // 1. Element with Top-Right SVG Badge (Success)
    diagram.addElement(new Element('el1', new RectangleShape(80, 50)))
        .addWrappedText('SVG Badge\nTop-Right')
        .addBadge(checkIcon, 'top-right');

    // 2. Element with Bottom-Left Image Badge
    diagram.addElement(new Element('el2', new RoundedRectangleShape(80, 50)))
        .addWrappedText('Image Badge\nBottom-Left')
        .positionRightOf('el1')
        .addBadge(badgeUrl, 'bottom-left', 15);

    // 3. Element with Multiple Badges
    diagram.addElement(new Element('el3', new RectangleShape(80, 50)))
        .addWrappedText('Multiple\nBadges')
        .positionRightOf('el2')
        .addBadge(infoIcon, 'top-left')
        .addBadge(alertIcon, 'bottom-right');

    // 4. Circular Element with Badges
    diagram.addElement(new Element('el4', new CircleShape(50, 50)))
        .addWrappedText('Circle\nBadges')
        .positionDownOf('el1')
        .addBadge(checkIcon, 'top-right')
        .addBadge(alertIcon, 'top-left');

    // 5. Large Badge example
    diagram.addElement(new Element('el5', new RoundedRectangleShape(80, 50)))
        .addWrappedText('Large\nBadge')
        .positionRightOf('el4')
        .addBadge(infoIcon, 'top-right', 25); // size 25

    // 6. Image badge on Top-Left
    diagram.addElement(new Element('el6', new RectangleShape(80, 50)))
        .addWrappedText('Image Badge\nTop-Left')
        .positionRightOf('el5')
        .addBadge(badgeUrl, 'top-left', 15);

    // 7. Animated GIF Badge
    diagram.addElement(new Element('el7', new RoundedRectangleShape(80, 50)))
        .addWrappedText('Animated GIF\nBadge')
        .positionDownOf('el4')
        .addBadge(starUrl, 'top-right', 30);

    // 8. Silver Star GIF Badge
    diagram.addElement(new Element('el8', new RoundedRectangleShape(80, 50)))
        .addWrappedText('Silver Star\nGIF Badge')
        .positionRightOf('el7')
        .addBadge(starSilverUrl, 'top-right', 30);

    diagram.arrange();
    diagram.fitScreen();

    return diagram;
}
