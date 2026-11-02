import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Users, RefreshCw, Send, Check, X, ArrowLeft, Paperclip, ImagePlus, FileText, Download } from "lucide-react";
import { apiRequest, API_BASE } from "./api";
import "./SocialPage.css";

function Avatar({ person }) {
  return <div className="social-avatar">{person.profile_photo ? <img src={`${API_BASE}/${person.profile_photo}`} alt="" /> : (person.full_name || "S").trim().split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase()}</div>;
}
export default function SocialPage({ currentUserId }) {
  const [data,setData]=useState({incoming_requests:[],friends:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [active,setActive]=useState(null);
  const [messages,setMessages]=useState([]);
  const [draft,setDraft]=useState("");
  const [attachment,setAttachment]=useState(null);
  const [uploading,setUploading]=useState(false);
  const fileInput=useRef(null);
  const cameraInput=useRef(null);
  const [notice,setNotice]=useState("");
  const [sending,setSending]=useState(false);
  const [chatLoading,setChatLoading]=useState(false);
  const messageCache=useRef(new Map());
  const pollInFlight=useRef(false);
  const socialLoadId=useRef(0);
  const messageLoadId=useRef(0);
  const activeUserId=useRef(null);
  const refreshSocialData=useCallback(async()=>{const id=++socialLoadId.current;try{const result=await apiRequest("social.php");if(id===socialLoadId.current)setData(result);}catch(e){if(id===socialLoadId.current)setNotice(e.message||"Unable to refresh connections.");}},[]);
  const refresh=useCallback(async()=>{const id=++socialLoadId.current;setLoading(true);setError("");try{const result=await apiRequest("social.php");if(id===socialLoadId.current)setData(result);}catch(e){if(id===socialLoadId.current)setError(e.message||"Unable to load connections.");}finally{if(id===socialLoadId.current)setLoading(false);}},[]);
  useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(active)refresh();});return()=>{active=false;};},[refresh]);
  useEffect(()=>{
    activeUserId.current=active?.user_id ?? null;
    if(!active)return;
    let mounted=true;
    const poll=async()=>{
      if(pollInFlight.current||document.visibilityState!=="visible")return;
      pollInFlight.current=true;
      try{
        const result=await apiRequest("messages.php?user_id="+active.user_id);
        if(mounted&&Number(activeUserId.current)===Number(active.user_id)){
          const next=result.messages||[];
          const previous=messageCache.current.get(String(active.user_id))||[];
          const changed=next.length!==previous.length||(next.length>0&&previous.length>0&&String(next[next.length-1].id)!==String(previous[previous.length-1].id));
          messageCache.current.set(String(active.user_id),next);
          setMessages(next);
          if(changed)refreshSocialData();
        }
      }catch(e){if(mounted)setNotice(e.message||"Unable to refresh messages.");}
      finally{pollInFlight.current=false;}
    };
    const timer=setInterval(poll,12000);
    return()=>{mounted=false;clearInterval(timer);};
  },[active,refreshSocialData]);
  async function requestAction(user_id,action){try{await apiRequest("friend_request.php",{method:"POST",body:JSON.stringify({user_id,action})});setNotice(action==="accept"?"Friend request accepted.":"Request declined.");await refresh();}catch(e){setNotice(e.message||"Unable to update request.");}}
  async function openChat(friend){
    const friendId=String(friend.user_id);
    activeUserId.current=friend.user_id;
    setActive(friend);
    setDraft("");
    setNotice("");
    const cached=messageCache.current.get(friendId);
    setMessages(cached||[]);
    setChatLoading(!cached);
    const id=++messageLoadId.current;
    try{
      const result=await apiRequest("messages.php?user_id="+friend.user_id);
      if(id===messageLoadId.current&&Number(activeUserId.current)===Number(friend.user_id)){
        const next=result.messages||[];
        messageCache.current.set(friendId,next);
        setMessages(next);
        refreshSocialData();
      }
    }catch(e){if(id===messageLoadId.current)setNotice(e.message||"Unable to load messages.");}
    finally{if(id===messageLoadId.current)setChatLoading(false);}
  }
  function selectAttachment(event){
    const file=event.target.files?.[0];
    if(!file)return;
    const allowedTypes=["image/jpeg","image/png","image/webp","image/gif","application/pdf","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if(file.size>10*1024*1024){setNotice("Files must be 10 MB or smaller.");event.target.value="";return;}
    if(!allowedTypes.includes(file.type)){setNotice("Supported files: JPG, PNG, WebP, GIF, PDF, Word, Excel, PowerPoint, and text files.");event.target.value="";return;}
    setAttachment(file);setNotice("");
  }
  async function send(event){
    event.preventDefault();
    if(!active||sending||(!draft.trim()&&!attachment))return;
    setSending(true);setNotice("");
    const text=draft.trim();
    try{
      if(attachment){
        const form=new FormData();
        form.append("user_id",String(active.user_id));
        form.append("file",attachment);
        if(text)form.append("body",text);
        setUploading(true);
        await apiRequest("message_attachment.php",{method:"POST",body:form});
      }else{
        await apiRequest("messages.php",{method:"POST",body:JSON.stringify({user_id:active.user_id,body:text})});
      }
      setDraft("");setAttachment(null);
      if(fileInput.current)fileInput.current.value="";
      if(cameraInput.current)cameraInput.current.value="";
      const r=await apiRequest("messages.php?user_id="+active.user_id);
      setMessages(r.messages||[]);messageCache.current.set(String(active.user_id),r.messages||[]);refreshSocialData();
    }catch(e){setNotice(e.message||"Unable to send message.");}
    finally{setSending(false);setUploading(false);}
  }
  function renderAttachment(message){
    if(!message.attachment_name)return null;
    const url=API_BASE+"/message_attachment.php?id="+encodeURIComponent(message.id);
    return <a className="social-attachment" href={url} target="_blank" rel="noreferrer">
      {String(message.attachment_mime||"").startsWith("image/")?<img src={url} alt={message.attachment_name} loading="lazy" crossOrigin="use-credentials"/>:<span className="social-file-icon"><FileText size={22}/></span>}
      <span><strong>{message.attachment_name}</strong><small>{Math.max(1,Math.round(Number(message.attachment_size||0)/1024))} KB · Open attachment</small></span><Download size={16}/>
    </a>;
  }
  return <div className="social-page">
    <div className="social-page-heading"><div><span className="social-kicker"><Users size={15}/> CAMPUS COMMUNITY</span><h2>Friends & messages</h2><p>Manage friend requests and continue your conversations.</p></div><button onClick={refresh} disabled={loading}><RefreshCw size={16}/> Refresh</button></div>
    {notice&&<p className="social-notice">{notice}</p>}{error&&<p className="social-error">{error}</p>}
    <div className={"social-layout "+(active?"chat-open":"")}>
      <section className="social-list-panel">
        <div className="social-section-title"><h3>Friend requests</h3><span>{data.incoming_requests.length}</span></div>
        {loading?<p className="social-muted">Loading requests...</p>:data.incoming_requests.length===0?<p className="social-muted">No pending friend requests.</p>:data.incoming_requests.map(person=><div className="social-person" key={person.request_id}><Avatar person={person}/><div className="social-person-copy"><strong>{person.full_name}</strong><small>{person.university||"Campus member"}</small></div><div className="social-person-actions"><button title="Accept" onClick={()=>requestAction(person.user_id,"accept")}><Check size={16}/></button><button title="Decline" className="social-decline" onClick={()=>requestAction(person.user_id,"decline")}><X size={16}/></button></div></div>)}
        <div className="social-section-title social-friends-title"><h3>Your friends</h3><span>{data.friends.length}</span></div>
        {loading?<p className="social-muted">Loading friends...</p>:data.friends.length===0?<p className="social-muted">Your accepted connections will appear here.</p>:data.friends.map(friend=><button className={"social-friend-row "+(active?.user_id===friend.user_id?"selected":"")} key={friend.friendship_id} onClick={()=>openChat(friend)}><Avatar person={friend}/><span className="social-person-copy"><strong>{friend.full_name}</strong><small>{friend.last_message?.body||friend.university||"Start a conversation"}</small></span>{Number(friend.unread_count)>0&&<span className="social-unread-count">{friend.unread_count>99?"99+":friend.unread_count}</span>}<MessageCircle size={17}/></button>)}
      </section>
      {active && <section className="social-chat-panel">      {active?<><header className="social-chat-header"><button className="social-back" onClick={()=>{activeUserId.current=null;messageLoadId.current+=1;setActive(null);setMessages([]);setChatLoading(false);}}><ArrowLeft size={18}/></button><Avatar person={active}/><div><strong>{active.full_name}</strong><small>Friend · Private conversation</small></div></header><div className="social-messages">{chatLoading&&!messages.length?<div className="social-chat-loading"><span/><span/><span/>Loading conversation…</div>:messages.length?messages.map(m=><div key={m.id} className={"social-bubble "+(Number(m.sender_id)===Number(currentUserId)?"mine":"theirs")}>{m.body&&<p>{m.body}</p>}{renderAttachment(m)}<time>{m.created_at}</time></div>):<div className="social-chat-empty"><MessageCircle size={28}/><strong>Start the conversation</strong><span>Say hello and share what you're learning.</span></div>}</div><form className="social-compose" onSubmit={send}>
        {attachment&&<div className="social-attachment-pending"><span>{attachment.name}</span><button type="button" onClick={()=>setAttachment(null)} aria-label="Remove attachment"><X size={15}/></button></div>}
        <div className="social-compose-row">
          <button type="button" className="social-attach-button" title="Attach a file" onClick={()=>fileInput.current?.click()}><Paperclip size={18}/></button>
          <button type="button" className="social-attach-button" title="Take or choose a photo" onClick={()=>cameraInput.current?.click()}><ImagePlus size={18}/></button>
          <input ref={fileInput} type="file" hidden accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={selectAttachment}/>
          <input ref={cameraInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={selectAttachment}/>
          <input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={4000} placeholder={"Message "+active.full_name+"..."} />
          <button type="submit" className="social-send-button" aria-label="Send message" title="Send message" disabled={(!draft.trim()&&!attachment)||sending}>{uploading?"…":<Send size={17}/>}</button>
        </div>
        <small className="social-compose-hint">Photos and documents up to 10 MB</small>
      </form></>:<div className="social-chat-placeholder"><div><MessageCircle size={34}/></div><h3>Your conversations</h3><p>Select a friend to view your chat history and send a private message.</p></div>}
      </section>}
    </div>
  </div>;
}
