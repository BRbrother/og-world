import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase.js';
import {
  ArrowRight, Search, ShoppingBag, Menu, X, Heart, UserRound,
  Truck, ShieldCheck, RefreshCw, Headphones, Instagram, ChevronDown, MapPin
} from 'lucide-react';

// Products are loaded from Supabase. The database is the source of truth.
const categories = [
  { name: 'Fashion', sub: 'Pieces that speak your style', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=85' },
  { name: 'Beauty', sub: 'Your everyday glow, elevated', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1100&q=85' },
  { name: 'Skincare', sub: 'Care that feels like you', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=85' },
];

function money(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function Header({ cartCount, onCart, onSearch, user, authReady, onAccount, onWishlist, wishlistCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  return <>
    <div className="announcement">A little something special — enjoy free shipping on orders above ₹999</div>
    <header className="header">
      <button className="icon-btn mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      <a className="brand" href="#" aria-label="OG WORLD home">
        <span className="brand-mark">OG</span><span className="brand-name">WORLD</span>
        <small>APNA ANDAAZ. APNI PEHCHAAN.</small>
      </a>
      <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
        <a href="#shop" onClick={() => setMenuOpen(false)}>Shop all</a>
        <a href="#fashion" onClick={() => setMenuOpen(false)}>Fashion</a>
        <a href="#beauty" onClick={() => setMenuOpen(false)}>Beauty</a>
        <a href="#skincare" onClick={() => setMenuOpen(false)}>Skincare</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>Our story</a>
      </nav>
      <div className="header-actions">
        <button className="icon-btn search-toggle" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search/></button>
        <button className="icon-btn account-btn" aria-label={user ? "My account" : "Sign in"} title={authReady && user ? `Signed in: ${user.email}` : "Sign in"} onClick={onAccount}><UserRound/></button>
        <button className="icon-btn wishlist-header" aria-label="Wishlist" onClick={onWishlist}><Heart/><span className="bag-count">{wishlistCount}</span></button>
        <button className="icon-btn bag-btn" aria-label="Shopping bag" onClick={onCart}><ShoppingBag/><span className="bag-count">{cartCount}</span></button>
      </div>
    </header>
    {searchOpen && <div className="search-panel"><Search size={18}/><input autoFocus placeholder="Search your next favourite..." onChange={e => onSearch(e.target.value)}/><button onClick={() => {setSearchOpen(false); onSearch('')}}><X size={18}/></button></div>}
  </>;
}

function ProductCard({ product, onAdd, liked, onToggleWishlist }) {
  return <article className="product-card">
    <div className="product-image-wrap">
      {product.image ? <img src={product.image} alt={product.name} className="product-image" loading="lazy"/> : <div className="product-image product-image-placeholder">OG WORLD</div>}
      <span className="product-tag">{product.tag || 'NEW ARRIVAL'}</span>
      <button className={'wishlist ' + (liked ? 'liked' : '')} aria-label="Add to wishlist" onClick={() => onToggleWishlist(product)}><Heart size={18} fill={liked ? 'currentColor' : 'none'}/></button>
      <button className="quick-add" onClick={() => onAdd(product)}>Add to bag <ArrowRight size={15}/></button>
    </div>
    <div className="product-meta"><span>{product.category}</span><span className="stars">OG PICK</span></div>
    <h3>{product.name}</h3>
    <div className="price-row"><strong>{money(product.price)}</strong>{product.oldPrice > product.price && <><del>{money(product.oldPrice)}</del><em>{Math.round((1-product.price/product.oldPrice)*100)}% off</em></>}</div>
  </article>;
}


function AuthPanel({ onClose, onSignedIn }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } }
        });
        if (error) throw error;
        if (data.session) {
          onSignedIn(data.user);
          onClose();
        } else {
          setMessage('Account created. Please check your email to confirm your account, then log in.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        onSignedIn(data.user);
        onClose();
      }
    } catch (err) {
      setMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-backdrop" onClick={onClose}>
    <section className="auth-panel" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="auth-close icon-btn" onClick={onClose} aria-label="Close"><X/></button>
      <span className="eyebrow">WELCOME TO OG WORLD</span>
      <h2 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h2>
      <p className="auth-subtitle">{mode === 'login' ? 'Sign in to view your account and orders.' : 'Join OG WORLD for a more personal shopping experience.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required placeholder="Your full name"/></label>}
        <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required placeholder="At least 6 characters"/></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="button button-dark full" disabled={busy}>{busy ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
      </form>
      <p className="auth-switch">{mode === 'login' ? "New to OG WORLD?" : 'Already have an account?'} <button onClick={() => {setMode(mode === 'login' ? 'signup' : 'login'); setMessage('')}}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
    </section>
  </div>;
}


function CheckoutPanel({ user, cart, onClose, onPlaced }) {
 const [addresses,setAddresses]=useState([]),[selectedAddress,setSelectedAddress]=useState(''),[adding,setAdding]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[method,setMethod]=useState('upi_manual'),[fee,setFee]=useState(0),[globalCod,setGlobalCod]=useState(false);
 const [form,setForm]=useState({recipient_name:'',phone:'',line1:'',line2:'',landmark:'',city:'',state:'',pincode:''});
 const subtotal=cart.reduce((n,i)=>n+i.price*i.qty,0), codOk=globalCod&&cart.every(i=>i.codEnabled), prepaidOk=cart.every(i=>i.prepaidEnabled), total=subtotal+fee;
 useEffect(()=>{if(!prepaidOk&&codOk)setMethod('cod');else if(prepaidOk&&!codOk)setMethod('upi_manual')},[prepaidOk,codOk]);
 useEffect(()=>{let live=true;(async()=>{const [{data:a,error},{data:st}]=await Promise.all([supabase.from('customer_addresses').select('*').order('is_default',{ascending:false}).order('created_at',{ascending:false}),supabase.from('store_settings').select('default_delivery_fee,cod_enabled_globally').eq('id',true).maybeSingle()]);if(!live)return;if(error)setMessage(error.message);else{setAddresses(a||[]);const d=(a||[]).find(x=>x.is_default)||(a||[])[0];if(d)setSelectedAddress(d.id)}if(st){setFee(Number(st.default_delivery_fee||0));setGlobalCod(!!st.cod_enabled_globally)}})();return()=>{live=false}},[]);
 const change=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
 async function save(e){e.preventDefault();setBusy(true);setMessage('');const {data,error}=await supabase.from('customer_addresses').insert({...form,user_id:user.id,is_default:addresses.length===0}).select().single();setBusy(false);if(error){setMessage(error.message);return}setAddresses(a=>[data,...a]);setSelectedAddress(data.id);setAdding(false);setForm({recipient_name:'',phone:'',line1:'',line2:'',landmark:'',city:'',state:'',pincode:''})}
 async function place(e){e.preventDefault();if(!selectedAddress){setMessage('Please select or add a delivery address.');return}setBusy(true);setMessage('');const {data,error}=await supabase.rpc('ogw_place_order',{p_address_id:selectedAddress,p_payment_method:method,p_customer_note:null,p_items:cart.map(i=>({product_id:i.id,quantity:i.qty}))});setBusy(false);if(error){setMessage(error.message);return}onPlaced(data)}
 return <div className="checkout-backdrop" onClick={onClose}><section className="checkout-panel" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true"><div className="drawer-head"><div><span className="eyebrow">OG WORLD · SECURE CHECKOUT</span><h2>Delivery details</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div><form className="checkout-content" onSubmit={place}>
 <div className="checkout-section"><div className="checkout-section-head"><h3><MapPin size={17}/> Delivery address</h3><button type="button" className="text-link" onClick={()=>setAdding(!adding)}>{adding?'CANCEL':'＋ ADD NEW'}</button></div>
 {!adding&&addresses.map(a=><label className={'address-option '+(selectedAddress===a.id?'selected':'')} key={a.id}><input type="radio" name="address" checked={selectedAddress===a.id} onChange={()=>setSelectedAddress(a.id)}/><span><b>{a.recipient_name} · {a.phone}</b><small>{a.line1}{a.line2?', '+a.line2:''}{a.landmark?', '+a.landmark:''}, {a.city}, {a.state} - {a.pincode}</small></span></label>)}
 {!adding&&!addresses.length&&<p className="checkout-muted">No saved address yet. Add your delivery address.</p>}
 {adding&&<div className="address-form">{[['recipient_name','Full name'],['phone','Mobile number'],['line1','Address line 1'],['line2','Address line 2 (optional)'],['landmark','Landmark (optional)'],['city','City'],['state','State'],['pincode','PIN code']].map(([k,l])=><label className={['line1','line2','landmark'].includes(k)?'wide':''} key={k}>{l}<input name={k} value={form[k]} onChange={change} required={!['line2','landmark'].includes(k)} /></label>)}<button type="button" className="button button-dark wide" disabled={busy} onClick={save}>{busy?'SAVING…':'SAVE ADDRESS'}</button></div>}</div>
 <div className="checkout-section"><h3>Payment method</h3>{prepaidOk&&<label className="payment-option"><input type="radio" name="payment" checked={method==='upi_manual'} onChange={()=>setMethod('upi_manual')}/><span><b>UPI / Prepaid</b><small>Pay by UPI after placing your order. Submit your UTR for verification.</small></span></label>}{codOk&&<label className="payment-option"><input type="radio" name="payment" checked={method==='cod'} onChange={()=>setMethod('cod')}/><span><b>Cash on Delivery</b><small>Pay when your order is delivered.</small></span></label>}{!prepaidOk&&!codOk&&<p className="checkout-muted">No payment method is enabled for this cart.</p>}</div>
 <div className="checkout-section"><h3>Order summary</h3>{cart.map(i=><div className="summary-line" key={i.id}><span>{i.name} × {i.qty}</span><b>{money(i.price*i.qty)}</b></div>)}<div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="summary-line"><span>Delivery</span><b>{fee?money(fee):'FREE'}</b></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></div>
 {message&&<p className="checkout-message" role="alert">{message}</p>}<button className="button button-dark full" disabled={busy||!selectedAddress||(!prepaidOk&&!codOk)}>{busy?'PLACING ORDER…':`PLACE ORDER · ${money(total)}`}</button><p className="checkout-footnote">Order prices are verified securely against the OG WORLD catalogue.</p></form></section></div>
}



function PaymentPanel({ order, user, onClose, onSubmitted }) {
  const [utr,setUtr]=useState('');
  const [proof,setProof]=useState(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const upiId='9256259598@upi', payee='OG WORLD';
  const upiLink=`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${encodeURIComponent(order.total)}&cu=INR&tn=${encodeURIComponent(`Order ${order.order_number}`)}`;
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiLink)}`;

  async function submit(e){
    e.preventDefault();
    if(!utr.trim()){setMessage('Please enter the UTR / transaction reference number.');return;}
    setBusy(true);setMessage('');
    try{
      let screenshotPath=null;
      if(proof){
        const ext=(proof.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
        const path=`${user.id}/${order.id}/${Date.now()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from('payment-proofs').upload(path,proof,{ upsert:false, contentType:proof.type||'image/jpeg' });
        if(uploadError)throw uploadError;
        screenshotPath=path;
      }
      const {error}=await supabase.from('payment_submissions').insert({
        order_id:order.id,user_id:user.id,claimed_amount:Number(order.total),
        utr:utr.trim(),screenshot_url:screenshotPath,status:'submitted'
      });
      if(error)throw error;
      onSubmitted();
    }catch(err){setMessage(err.message||'Payment submission failed. Please try again.');}
    finally{setBusy(false);}
  }
  return <div className="checkout-backdrop" onClick={onClose}>
    <section className="checkout-panel payment-panel" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
      <div className="drawer-head"><div><span className="eyebrow">OG WORLD · PAYMENT</span><h2>Complete your payment</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="checkout-content">
        <div className="payment-order"><span>Order number</span><b>{order.order_number}</b><span>Amount to pay</span><strong>{money(order.total)}</strong></div>
        <div className="upi-card">
          <p className="eyebrow">SCAN & PAY USING ANY UPI APP</p>
          <img className="upi-qr" src={qrUrl} alt="UPI payment QR code"/>
          <b>{payee}</b><span>{upiId}</span>
          <a className="button button-dark full" href={upiLink}>PAY ₹{Number(order.total).toLocaleString('en-IN')} WITH UPI APP</a>
          <p className="checkout-muted">Pay the exact amount shown above. Do not pay twice.</p>
        </div>
        <form onSubmit={submit} className="payment-submit-form">
          <h3>After making payment</h3>
          <label>UPI UTR / Transaction ID<input value={utr} onChange={e=>setUtr(e.target.value)} required placeholder="Enter 12-digit UTR / reference number"/></label>
          <label>Payment screenshot (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setProof(e.target.files?.[0]||null)}/></label>
          {message&&<p className="checkout-message" role="alert">{message}</p>}
          <button className="button button-dark full" disabled={busy}>{busy?'SUBMITTING…':'SUBMIT PAYMENT DETAILS'}</button>
          <p className="checkout-footnote">Your order will remain pending until OG WORLD verifies the payment. Never share your UPI PIN or OTP.</p>
        </form>
      </div>
    </section>
  </div>;
}





function AccountPanel({ user, onClose, onSignedOut }) {
  const [profile,setProfile]=useState({full_name:'',phone:''});
  const [orders,setOrders]=useState([]),[items,setItems]=useState([]);
  const [busy,setBusy]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{let live=true;(async()=>{
    const [pr,or]=await Promise.all([
      supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle(),
      supabase.from('orders').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
    ]);
    if(!live)return;
    if(pr.error||or.error)setMessage(pr.error?.message||or.error?.message||'Could not load account details.');
    if(pr.data)setProfile({full_name:pr.data.full_name||'',phone:pr.data.phone||''});
    const list=or.data||[];setOrders(list);
    if(list.length){const it=await supabase.from('order_items').select('*').in('order_id',list.map(o=>o.id));if(!live)return;if(it.error)setMessage(it.error.message);else setItems(it.data||[])}
    setBusy(false);
  })();return()=>{live=false}},[user.id]);
  async function saveProfile(e){e.preventDefault();setSaving(true);setMessage('');const {error}=await supabase.from('profiles').update({full_name:profile.full_name.trim(),phone:profile.phone.trim()}).eq('id',user.id);setSaving(false);setMessage(error?error.message:'Profile updated successfully.');}
  const steps=['confirmed','purchased','shipped','delivered'];
  const statusLabel=s=>String(s||'pending_payment').replaceAll('_',' ');
  return <div className="account-backdrop" onClick={onClose}><section className="account-panel" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
    <div className="drawer-head"><div><span className="eyebrow">OG WORLD · MY ACCOUNT</span><h2>Your account</h2><p className="account-email">{user.email}</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <div className="account-content">
      <section className="account-section"><h3>Personal details</h3><form className="profile-form" onSubmit={saveProfile}><label>Full name<input value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))} placeholder="Your name"/></label><label>Mobile number<input value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="Your mobile number"/></label><button className="button button-dark" disabled={saving}>{saving?'SAVING…':'SAVE PROFILE'}</button></form></section>
      <section className="account-section"><h3>My orders <span className="muted">({orders.length})</span></h3>
        {busy&&<p className="account-muted">Loading your orders…</p>}
        {!busy&&!orders.length&&<p className="account-muted">You have not placed any orders yet.</p>}
        {orders.map(o=>{const its=items.filter(i=>i.order_id===o.id);const current=steps.indexOf(o.order_status);return <article className="tracking-card" key={o.id}>
          <div className="tracking-top"><div><span className="eyebrow">{o.order_number}</span><small>{new Date(o.created_at).toLocaleDateString('en-IN')}</small></div><b>{money(o.total)}</b></div>
          <div className="tracking-items">{its.map(i=><span key={i.id}>{i.product_name} × {i.quantity}</span>)}</div>
          <div className="tracking-status"><b>{statusLabel(o.order_status)}</b><span>Payment: {statusLabel(o.payment_status)}</span></div>
          {o.order_status==='cancelled'||o.order_status==='refund_pending'||o.order_status==='refunded'||o.order_status==='pending_payment'||o.order_status==='payment_review'?<p className="account-muted">{o.order_status==='pending_payment'?'Waiting for payment verification.':o.order_status==='payment_review'?'Your payment is under review.':`Current order status: ${statusLabel(o.order_status)}.`}</p>:<div className="tracking-steps">{steps.map((st,i)=><div className={current>=i?'done':''} key={st}><span></span><small>{statusLabel(st)}</small></div>)}</div>}
        </article>})}
      </section>
      {message&&<p className="account-message" role="status">{message}</p>}
      <button className="button button-outline account-signout" onClick={onSignedOut}>SIGN OUT</button>
    </div>
  </section></div>;
}

function WishlistPanel({ products, wishlistIds, onToggle, onAdd, onClose }) {
  const saved=products.filter(p=>wishlistIds.includes(p.id));
  return <div className="account-backdrop" onClick={onClose}><section className="account-panel" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
    <div className="drawer-head"><div><span className="eyebrow">OG WORLD · SAVED FINDS</span><h2>Your wishlist</h2></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <div className="wishlist-list">{saved.map(p=><article className="wishlist-row" key={p.id}>{p.image?<img src={p.image} alt={p.name}/>:<div className="cart-image-placeholder">OG</div>}<div><span className="eyebrow">{p.category}</span><h3>{p.name}</h3><b>{money(p.price)}</b><div className="wishlist-row-actions"><button className="text-link" onClick={()=>onAdd(p)}>ADD TO BAG</button><button className="text-link" onClick={()=>onToggle(p)}>REMOVE</button></div></div></article>)}{!saved.length&&<p className="account-muted">Your wishlist is empty. Tap the heart on a product to save it here.</p>}</div>
  </section></div>;
}

function AdminPanel({ user, onClose }) {
  const [tab,setTab]=useState('orders');
  const [orders,setOrders]=useState([]),[items,setItems]=useState([]),[payments,setPayments]=useState([]);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function load(){
    setBusy(true);setMessage('');
    const [o,p]=await Promise.all([
      supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100),
      supabase.from('payment_submissions').select('*').order('created_at',{ascending:false}).limit(100)
    ]);
    if(o.error||p.error){setMessage(o.error?.message||p.error?.message||'Could not load admin data.');setBusy(false);return;}
    setOrders(o.data||[]);setPayments(p.data||[]);
    const ids=(o.data||[]).map(x=>x.id);
    if(ids.length){const it=await supabase.from('order_items').select('*').in('order_id',ids);if(!it.error)setItems(it.data||[]);else setMessage(it.error.message);}
    else setItems([]);
    setBusy(false);
  }
  useEffect(()=>{load()},[]);
  async function verify(payment, approved){
    const promptText=approved?'Confirm that this UPI payment is visible in your bank/UPI account?':'Reject this payment submission?';
    if(!window.confirm(promptText))return;
    setBusy(true);setMessage('');
    const {error:pe}=await supabase.from('payment_submissions').update({status:approved?'paid':'failed',verified_by:user.id,verified_at:new Date().toISOString()}).eq('id',payment.id);
    if(pe){setMessage(pe.message);setBusy(false);return;}
    const {error:oe}=await supabase.from('orders').update({payment_status:approved?'paid':'failed',order_status:approved?'confirmed':'pending_payment'}).eq('id',payment.order_id);
    if(oe){setMessage('Payment submission updated, but order update failed: '+oe.message);setBusy(false);await load();return;}
    setMessage(approved?'Payment verified and order confirmed.':'Payment rejected.');
    await load();
  }
  async function updateOrderStatus(orderId,status){
    setBusy(true);setMessage('');const {error}=await supabase.from('orders').update({order_status:status}).eq('id',orderId);
    if(error)setMessage(error.message);else setMessage('Order status updated.');await load();
  }
  function orderItems(orderId){return items.filter(x=>x.order_id===orderId)}
  return <div className="admin-backdrop"><section className="admin-panel">
    <header className="admin-header"><div><span className="eyebrow">OG WORLD · CONTROL ROOM</span><h2>Admin dashboard</h2><p>Signed in as {user.email}</p></div><div className="admin-head-actions"><button className="filter-chip" onClick={load}>REFRESH</button><button className="icon-btn" onClick={onClose} aria-label="Close admin">×</button></div></header>
    <div className="admin-tabs"><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>ORDERS ({orders.length})</button><button className={tab==='payments'?'active':''} onClick={()=>setTab('payments')}>PAYMENTS ({payments.filter(p=>p.status==='submitted').length} pending)</button></div>
    {message&&<p className="admin-message">{message}</p>}{busy&&<p className="admin-muted">Loading / updating…</p>}
    {tab==='orders'&&<div className="admin-list">{orders.map(o=><article className="admin-card" key={o.id}><div className="admin-card-top"><div><span className="eyebrow">{o.order_number}</span><h3>{money(o.total)}</h3><small>{new Date(o.created_at).toLocaleString('en-IN')}</small></div><span className="admin-status">{o.order_status} · {o.payment_status}</span></div><p className="admin-address">{typeof o.address_snapshot==='string'?o.address_snapshot:JSON.stringify(o.address_snapshot||{})}</p><div className="admin-item-list">{orderItems(o.id).map(it=><div key={it.id}>{it.product_name} × {it.quantity} <b>{money(it.unit_price*it.quantity)}</b></div>)}</div><div className="admin-card-bottom"><label>Order status<select value={o.order_status} onChange={e=>updateOrderStatus(o.id,e.target.value)} disabled={busy}><option value="pending_payment">Pending payment</option><option value="payment_review">Payment review</option><option value="confirmed">Confirmed</option><option value="purchased">Purchased</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option><option value="refund_pending">Refund pending</option><option value="refunded">Refunded</option></select></label><span>Payment: {o.payment_method}</span></div></article>)}{!orders.length&&!busy&&<p className="admin-muted">No orders found yet.</p>}</div>}
    {tab==='payments'&&<div className="admin-list">{payments.map(p=>{const order=orders.find(o=>o.id===p.order_id);return <article className="admin-card" key={p.id}><div className="admin-card-top"><div><span className="eyebrow">{order?.order_number||p.order_id}</span><h3>{money(p.claimed_amount)}</h3><small>{new Date(p.created_at).toLocaleString('en-IN')}</small></div><span className="admin-status">{p.status}</span></div><p><b>UTR:</b> {p.utr}</p><p><b>Customer:</b> {p.user_id}</p>{p.screenshot_url&&<button className="text-link" onClick={async()=>{const {data,error}=await supabase.storage.from('payment-proofs').createSignedUrl(p.screenshot_url,120);if(error)setMessage(error.message);else window.open(data.signedUrl,'_blank','noopener,noreferrer')}}>VIEW PAYMENT SCREENSHOT</button>}{p.status==='submitted'&&<div className="admin-actions"><button className="button button-dark" disabled={busy} onClick={()=>verify(p,true)}>VERIFY PAYMENT</button><button className="button button-outline" disabled={busy} onClick={()=>verify(p,false)}>REJECT</button></div>}</article>})}{!payments.length&&!busy&&<p className="admin-muted">No payment submissions yet.</p>}</div>}
  </section></div>;
}

function App() {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const [wishlistOpen,setWishlistOpen]=useState(false);
  const [wishlistIds,setWishlistIds]=useState(()=>{try{return JSON.parse(localStorage.getItem('ogw-wishlist')||'[]')}catch{return []}});
  const [sortOrder,setSortOrder]=useState('newest');

  useEffect(() => {
    let alive = true;
    async function loadProducts() {
      setProductsLoading(true);
      setProductsError('');
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category, image_urls, selling_price, mrp, is_active, variants, prepaid_enabled, cod_enabled')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!alive) return;
      if (error) {
        setProductsError(error.message);
        setProducts([]);
      } else {
        setProducts((data || []).map(row => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          category: row.category,
          image: Array.isArray(row.image_urls) ? row.image_urls.find(Boolean) : '',
          price: Number(row.selling_price || 0),
          oldPrice: Number(row.mrp || 0),
          tag: Number(row.mrp || 0) > Number(row.selling_price || 0) ? 'SPECIAL PRICE' : 'NEW ARRIVAL',
          variants: row.variants || {},
          prepaidEnabled: row.prepaid_enabled,
          codEnabled: row.cod_enabled
        })));
      }
      setProductsLoading(false);
    }
    loadProducts();
    const channel = supabase.channel('ogw-active-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadProducts)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (alive) { setUser(session?.user ?? null); setAuthReady(true); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  function handleAccount() { if (!user) { setAuthOpen(true); return; } setAccountOpen(true); }
  useEffect(()=>{localStorage.setItem('ogw-wishlist',JSON.stringify(wishlistIds))},[wishlistIds]);
  function toggleWishlist(product){setWishlistIds(ids=>ids.includes(product.id)?ids.filter(id=>id!==product.id):[...ids,product.id]);setNotice(wishlistIds.includes(product.id)?'Removed from wishlist':'Added to wishlist');setTimeout(()=>setNotice(''),1800)}
  async function signOut(){const {error}=await supabase.auth.signOut();if(error)setNotice(error.message);else{setAccountOpen(false);setNotice('You have been signed out.')}}
  useEffect(()=>{let live=true;setIsAdmin(false);if(user){supabase.from('profiles').select('role').eq('id',user.id).maybeSingle().then(({data,error})=>{if(live&&!error)setIsAdmin(data?.role==='admin')})}return()=>{live=false}},[user]);

  const [query, setQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => {const list=products.filter(p => (categoryFilter === 'All' || p.category?.toLowerCase() === categoryFilter.toLowerCase()) && (p.name + ' ' + p.category + ' ' + p.description).toLowerCase().includes(query.toLowerCase()));return list.sort((a,b)=>sortOrder==='price-low'?a.price-b.price:sortOrder==='price-high'?b.price-a.price:sortOrder==='name'?a.name.localeCompare(b.name):0)}, [products, query, categoryFilter, sortOrder]);
  const addToCart = (product) => {
    setCart(items => {
      const found = items.find(i => i.id === product.id);
      return found ? items.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i) : [...items, {...product, qty: 1}];
    });
    setNotice(`${product.name} added to your bag`);
    setTimeout(() => setNotice(''), 2200);
  };
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return <div className="site-shell">
    <Header cartCount={cart.reduce((n, i) => n + i.qty, 0)} onCart={() => setCartOpen(true)} onSearch={setQuery} user={user} authReady={authReady} onAccount={handleAccount} onWishlist={()=>setWishlistOpen(true)} wishlistCount={wishlistIds.length}/>
    {isAdmin && <div className="admin-entry-wrap"><button className="admin-entry" onClick={()=>setAdminOpen(true)}>OPEN ADMIN DASHBOARD</button></div>}
    <main>
      <section className="hero">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90" alt="Fashion editorial collection" className="hero-image"/>
        <div className="hero-shade"></div>
        <div className="hero-content">
          <span className="eyebrow light">WELCOME TO OG WORLD · YOUR STYLE DESTINATION</span>
          <h1>Find your style.<br/><i>Own your moment.</i></h1>
          <p>Fresh fashion, beauty and skincare finds — handpicked for your everyday.</p>
          <a className="button button-light" href="#products">SHOP THE COLLECTION <ArrowRight size={16}/></a>
        </div>
        <div className="hero-note"><span>01 / 03</span><span>THE EVERYDAY COLLECTION</span></div>
      </section>

      <section className="marketplace-trust" aria-label="Shopping benefits">
        <div><Truck/><span><b>Delivery across India</b><small>Updates on every order</small></span></div>
        <div><ShieldCheck/><span><b>Secure checkout</b><small>Shop with confidence</small></span></div>
        <div><RefreshCw/><span><b>Easy order tracking</b><small>Stay in the loop</small></span></div>
        <div><Headphones/><span><b>Customer support</b><small>We're here to help</small></span></div>
      </section>

      <section className="category-section section-pad" id="shop">
        <div className="section-heading"><div><span className="eyebrow">SHOP BY CATEGORY</span><h2>Find what you love</h2></div><a href="#products" className="text-link">VIEW ALL <ArrowRight size={15}/></a></div>
        <div className="category-grid">
          {categories.map((c, i) => <a className="category-card" id={c.name.toLowerCase()} href="#products" onClick={() => setCategoryFilter(c.name)} key={c.name}>
            <img src={c.image} alt={c.name} loading="lazy"/><div className="category-overlay"></div>
            <div className="category-copy"><span>0{i+1} / CATEGORY</span><h3>{c.name}</h3><p>{c.sub}</p><b>DISCOVER <ArrowRight size={15}/></b></div>
          </a>)}
        </div>
      </section>

      <section className="products-section section-pad" id="products">
        <div className="section-heading"><div><span className="eyebrow">THE OG COLLECTION</span><h2>{query ? 'Search results' : categoryFilter === 'All' ? 'Trending right now' : categoryFilter}</h2></div><span className="muted">{filtered.length} pieces</span></div>
        <div className="product-toolbar"><div className="product-filters">
          {['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))].map(category => <button key={category} className={categoryFilter === category ? 'filter-chip active' : 'filter-chip'} onClick={() => setCategoryFilter(category)}>{category}</button>)}
        </div><label className="sort-control">Sort by <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)}><option value="newest">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label></div>
        <div className="product-grid">
          {productsLoading && <p className="empty-state">Loading products from OG WORLD…</p>}
          {!productsLoading && productsError && <div className="empty-state product-error"><strong>Products could not be loaded.</strong><br/>{productsError}<br/><button className="filter-chip active" onClick={() => window.location.reload()}>Try again</button></div>}
          {!productsLoading && !productsError && filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} liked={wishlistIds.includes(p.id)} onToggleWishlist={toggleWishlist}/>)}
          {!productsLoading && !productsError && !filtered.length && <p className="empty-state">{products.length === 0 ? 'Our collection is being prepared. Check back soon.' : 'No products match that search. Try another word.'}</p>}
        </div>
      </section>

      <section className="brand-banner" id="about">
        <div className="banner-image"></div><div className="banner-copy"><span className="eyebrow light">THE OG WORLD PROMISE</span><h2>Good finds.<br/><i>Great feels.</i></h2><p>Discover everyday favourites across fashion, beauty and skincare. A little inspiration, a lot of personality — all in one place.</p><a href="#products" className="button button-outline">EXPLORE PRODUCTS <ArrowRight size={16}/></a></div>
      </section>

      <section className="benefits section-pad">
        <div className="benefit"><Truck/><h3>Thoughtful delivery</h3><p>Clear delivery updates, every step of the way.</p></div>
        <div className="benefit"><ShieldCheck/><h3>Secure shopping</h3><p>A smooth and secure checkout experience.</p></div>
        <div className="benefit"><RefreshCw/><h3>Easy support</h3><p>We're here to help with your shopping queries.</p></div>
        <div className="benefit"><Headphones/><h3>Here for you</h3><p>Reach out whenever you need a hand.</p></div>
      </section>
    </main>

    <footer className="footer">
      <div className="footer-main"><div className="footer-brand"><a className="brand brand-footer" href="#"><span className="brand-mark">OG</span><span className="brand-name">WORLD</span><small>APNA ANDAAZ. APNI PEHCHAAN.</small></a><p>Find your look. Own your story.</p><a className="social" href="https://www.instagram.com/" target="_blank" rel="noreferrer"><Instagram size={18}/> Instagram</a></div>
        <div><h4>SHOP</h4><a href="#shop">All products</a><a href="#fashion">Fashion</a><a href="#beauty">Beauty</a><a href="#skincare">Skincare</a></div>
        <div><h4>HELP</h4><a href="#contact">Contact us</a><a href="#shipping">Shipping policy</a><a href="#returns">Returns & refunds</a><a href="#faq">FAQs</a></div>
        <div><h4>THE OG LETTER</h4><p>Get first dibs on new drops and special offers.</p><form className="newsletter" onSubmit={e => {e.preventDefault(); setNotice('Thanks for joining the OG letter!'); setTimeout(() => setNotice(''), 2500)}}><input type="email" placeholder="Your email address" required/><button aria-label="Subscribe"><ArrowRight/></button></form></div>
      </div><div className="footer-bottom"><span>© 2026 OG WORLD. All rights reserved.</span><span>MADE FOR YOUR EVERYDAY.</span><span>India · INR ₹</span></div>
    </footer>

    {checkoutOpen && <CheckoutPanel user={user} cart={cart} onClose={() => setCheckoutOpen(false)} onPlaced={(order) => { setCheckoutOpen(false); setCart([]); setPaymentOrder(order); }}/>}
    {paymentOrder && <PaymentPanel order={paymentOrder} user={user} onClose={() => setPaymentOrder(null)} onSubmitted={() => { setPaymentOrder(null); setNotice("Payment details submitted. Your order is awaiting verification."); setTimeout(() => setNotice(""), 6000); }}/>}
    {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} onSignedIn={setUser}/>}
    {accountOpen && user && <AccountPanel user={user} onClose={()=>setAccountOpen(false)} onSignedOut={signOut}/>}
    {wishlistOpen && <WishlistPanel products={products} wishlistIds={wishlistIds} onToggle={toggleWishlist} onAdd={p=>{addToCart(p);setWishlistOpen(false);setCartOpen(true)}} onClose={()=>setWishlistOpen(false)}/> }
    {adminOpen && isAdmin && <AdminPanel user={user} onClose={()=>setAdminOpen(false)}/>}
    {notice && <div className="toast">{notice}</div>}
    {cartOpen && <div className="drawer-backdrop" onClick={() => setCartOpen(false)}><aside className="cart-drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag ({cart.reduce((n,i)=>n+i.qty,0)})</h2></div><button className="icon-btn" onClick={() => setCartOpen(false)}><X/></button></div>
      {cart.length ? <><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}>{item.image ? <img src={item.image} alt={item.name}/> : <div className="cart-image-placeholder">OG</div>}<div><b>{item.name}</b><span>{money(item.price)}</span><div className="qty"><button onClick={() => setCart(items => items.map(i => i.id===item.id ? {...i,qty:Math.max(1,i.qty-1)}:i))}>−</button><span>{item.qty}</span><button onClick={() => setCart(items => items.map(i => i.id===item.id ? {...i,qty:i.qty+1}:i))}>+</button><button className="remove" onClick={() => setCart(items => items.filter(i => i.id!==item.id))}>Remove</button></div></div></div>)}</div><div className="cart-total"><span>Subtotal</span><strong>{money(total)}</strong></div><p className="cart-hint">Shipping and discounts calculated at checkout.</p><button className="button button-dark full" onClick={() => { if (!user) { setCartOpen(false); setAuthOpen(true); setNotice('Please sign in to continue checkout.'); return; } setCartOpen(false); setCheckoutOpen(true); }}>CONTINUE TO CHECKOUT <ArrowRight size={16}/></button></> : <div className="empty-cart"><ShoppingBag size={34}/><h3>Your bag is waiting</h3><p>Looks like you haven't added anything yet.</p><button className="button button-dark" onClick={() => setCartOpen(false)}>EXPLORE PRODUCTS</button></div>}
    </aside></div>}
  </div>;
}

export default App;
