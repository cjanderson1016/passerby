/*
  File Name: Bulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

interface BulletinProps {
  show: boolean; // whether to show this tab or not, passed from parent
}

export default function Bulletin(props: BulletinProps) {
    return (
    <>
      {props.show && (
        <p> This is the bulletin component</p>
      )}
    </>
    )
}