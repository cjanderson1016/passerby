import "./AccessDenied.css"

type AccessDeniedProps = {
  privacytype: string;
};

export function AccessDenied({ privacytype }: AccessDeniedProps) {
  return (

    <div className="denied-shell">
        {privacytype === "Post" ? (
      <div className="denied-text">
        This User Has Set Their Posts To Private
        
      </div>):
    <div className="denied-text">
        This Profile Is Set To Private
        
      </div>}
    </div>
  );
}