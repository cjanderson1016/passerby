/*
  File Name: TitleComponent.tsx

  Description: Component for title items on the bulletin board.

  Author(s): Matthew Eagleman
*/
import type { BulletinComponent } from "./BulletinComponent";

export type TitleComponentType = BulletinComponent & {
  title: string;
}

interface titleProps {
  component: TitleComponentType;
}

export default function TitleComponent(props: titleProps) {
    return (
        <div>
            <h2>{props.component.title}</h2>
        </div>
    );
}