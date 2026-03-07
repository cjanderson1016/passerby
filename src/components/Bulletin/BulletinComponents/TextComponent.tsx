/*
  File Name: TextComponent.tsx

  Description: Component for text items on the bulletin board.

  Author(s): Matthew Eagleman
*/

import type { BulletinComponent } from "./BulletinComponent";

export type TextComponentType = BulletinComponent & {
  text: string;
}

interface textProps {
  component: TextComponentType;
}

export default function TextComponent(props: textProps) {
    return (
        <div>
            {props.component.text}
        </div>
    );
}