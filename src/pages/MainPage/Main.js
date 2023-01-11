import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useIsMounted } from "../../hooks"
import { useAccessTknRefresh } from "../../hooks"
import Slider from "react-slick";
import $ from "jquery";

const Main = () => {
	// const isMounted = useIsMounted()
	const accessTknRefresh = useAccessTknRefresh()
	const navigate = useNavigate();
	const location = useLocation();
	const [username, setUsername] = useState("")
	const [recommendedProd, setRecommendedProd] = useState([])
	const [rankingProd, setRankingProd] = useState([])
	const setting = {
		dots: false, infinite: false,
		slidesToShow: 3, slidesToScroll: 1, swipeToSlide: true,
		// speed: 1500, autoplay: true, autoplaySpeed: 4000,
	}
	const [modal1, setModal1] = useState(false)
	const [eventList, setEventList] = useState([])
	let [likeProducts, setLikeProducts] = useState([])
	let latestLikeProducts = useRef(likeProducts)

	/* Loading event list */
	useEffect(() => {
		let isMounted = true;
		$.ajax({
			async: true, type: "GET",
			url: "https://api.odoc-api.com/api/v1/events/",
			success: response => {
				if (isMounted)
					setEventList(response.results)
			},
			error: response => console.log(response)
		});
		return () => isMounted = false
	}, [])


	useEffect(() => {
		if(sessionStorage.getItem("access_token") === undefined)
			sessionStorage.removeItem("access_token")
	}, [])


	/* findout currently logged in user */
	useEffect(() => {
		let isMounted = true;
		$.ajax({
			async: false, type: 'GET',
			url: "https://api.odoc-api.com/api/v1/members/" + sessionStorage.getItem("user_pk") + "/",
			success: (response) => {
				if(isMounted)
					setUsername(response.username)
			},
			error: (response) => {
				console.log("error", response);
				alert("login failed.")
			},
		});
		return () => isMounted = false
	}, [])


	/* loading recommended products */
	useEffect(() => {
		let isMounted = true;
		$.ajax({
			async: true, type: 'GET',
			url: "https://api.odoc-api.com/api/v1/recommendations" + "?member_id=" + sessionStorage.getItem("user_pk"),
			success: (response) => {
				if(isMounted)
					setRecommendedProd(response)
			},
			error: (response) => {
				console.log(response)
				setModal1(true)
			}
		});
		return () => isMounted = false
	}, [])
	

	/* loading ranking products */
	useEffect(() => {
		let isMounted = true;
		$.ajax({
			async: true, type: 'GET',
			url: "https://api.odoc-api.com/api/v1/ranking/",
			success: (response) => {
				if(isMounted)
					setRankingProd(response.results)
			},
			error: (response) => console.log(response),
		});
		return () => isMounted = false
	}, [])


	/* retrieves user's favorite product */
	useEffect(() => {
		let isMounted = true;
		$.ajax({
			async: true, type: "GET",
			url: "https://api.odoc-api.com/api/v1/product-like/" + "?search=" + sessionStorage.getItem("user_pk"),
			beforeSend: (xhr) => xhr.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem("access_token")),
			success: (response) => {
				response.results.map((v) => {
					const product_id = v.like_product.product_id
					const element = document.getElementsByName(product_id)
					$(element).addClass("on")
				})
			},
			error: (response) => {
				if (response.statusText === "Unauthorized") {
					sessionStorage.setItem("access_token", accessTknRefresh())
					navigate(0);
				}
			},
		})
		return () => isMounted = false
	}, [])


	/* coloring bottom navigation bar icons */
	useEffect(() => {
		const pathname = location.pathname;
		if (pathname.startsWith("/test")) $("#fmenu1").addClass("on");
		else if (pathname.startsWith("/mykiin")) $("#fmenu2").addClass("on");
		else if (pathname.startsWith("/main")) $("#fmenu3").addClass("on");
		else if (pathname.startsWith("/search")) $("#fmenu4").addClass("on");
		else if (pathname.startsWith("/mypage")) $("#fmenu5").addClass("on")
	}, [])


	/* products user wants to try */
	useEffect(() => {
		let info;
		let like_product = []
        $.ajax({
            async: false, type: "GET",
            url: "https://api.odoc-api.com/api/v1/product-like/?search=" + sessionStorage.getItem("user_pk"),
            success: (response) => {
                info = response.results;
				for (let i = 0; i < info.length; i++){
					like_product = like_product.concat(info[i].like_product.product_id);
					setLikeProducts = like_product;
				}
				if ( info.length == 0 ) latestLikeProducts.current = [];
				else latestLikeProducts.current = setLikeProducts;
            },
            error: (response) => { console.log(response.results) }
        });
    })	


	/* find products user wants to try */
	const findLikeProducts = (likeIcon) => {
		let check = "fail";
        for (let i = 0; i < (latestLikeProducts.current).length; i++){
			if (likeIcon.id == latestLikeProducts.current[i]) {
				check = "success";
				break
			}
		}
		return check;
	}


	/* coloring products user wants to try */
	const likeState = (element) => {
		let isMounted = true;
		let likeIcon = document.getElementById(element);
		let check;
		if ( likeIcon && isMounted ) {
			check = findLikeProducts(likeIcon);
			if ( check == "success" ) return true;
			else if ( check == "fail" ) return false;
			else { console.log('likeIcon error'); return false; }
		}
	}


	const likeProduct = (product_id) => {
		$.ajax({
			async: true, type: "POST",
			url: "https://api.odoc-api.com/api/v2/like-product",
			data: { "like_product": product_id },
			dataType: "json",
			beforeSend: (xhr) => xhr.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem("access_token")),
			success: (response) => {
				const element = document.getElementsByName(product_id)
				$(element).toggleClass("on")
				if (response.message === "Like") {
					alert("좋아하는 상품 목록에 추가되었습니다.");
					if (latestLikeProducts.current.length == 0) {
						setLikeProducts = [];
						setLikeProducts = setLikeProducts.concat(product_id);
						latestLikeProducts.current = setLikeProducts
					}
					else latestLikeProducts.current = latestLikeProducts.current.concat(product_id)
				}
				else {
					alert("좋아하는 상품 목록에서 제거되었습니다.");
					latestLikeProducts.current = latestLikeProducts.current.filter( elem => elem !== product_id )
				}
				likeState(product_id)
			},
			error: (response) => console.log(response),
		});
	}


    return (
		<div>
			<header id="header" className="header">
				<div className="inr-c">
					<h2 className="hidden">메인</h2>
				</div>
			</header>
			<div id="container" className="container main">
				<div className="top_sch">
					<div className="inr-c">
						<div className="in">
							<Link to="/search">
								<div className="inp_txt">제품을 검색해 보세요</div>
								<button className="btn">
									<span className="i-set i_sch_t">검색</span>
								</button>
							</Link>
						</div>
						<div className="rgh">
							<button type="button" onClick={()=>{navigate("/mypage/notification")}} className="btn_alram on">
								<span className="i-set i_alram"></span>
							</button>
						</div>
					</div>
				</div>
				<div className="inr-c">
					<h2 className="h_tit1"><span><strong className="c-blue usernick">{username}</strong>님을 위한 추천</span></h2>
					<div className="lst_prd pr-mb2">
						{
							modal1 ?
								<Link to="/test">
									<img src={require("../../assets/images/Rproduct.png")} />
								</Link>
							:
								<Slider {...setting}>
									{recommendedProd.map(v => {
										return (
											<div key={v} className="item">
												<div className="thumb">
													<Link to={`products/${v.product_id}`}>
														<span className="im" style={{ backgroundImage: `url(${v.product_img_path})` }}></span>
													</Link>
													<button
														type="button" id={v.product_id}
														className={ likeState(v.product_id) ? "btn_favorit on" : "btn_favorit" }
														name={v.product_id} onClick={() => likeProduct(v.product_id)}>
														<span className="i-set i_favorit">좋아요</span>
													</button>
												</div>
												<div className="txt">
													<Link to={`products/${v.product_id}`}>
														<p className="t1">{v.brand.brand_name}</p>
														<p className="t2">{v.product_name}</p>
													</Link>
												</div>
											</div>
										)
									})}
								</Slider>
						}
			
					</div>
					<h2 className="h_tit1"><Link to="ranking"><span className="i-aft i_link1">카테고리별 상품 랭킹</span></Link></h2>
					<div className="lst_prd pr-mb2">
						<Slider {...setting} speed={0} autoplay={false}>
							{rankingProd.map(v => {
								v = v.product_id
								return (
									<div key={v} className="item">
										<div className="thumb">
											<Link to={`products/${v.product_id}`}>
												<span className="im" style={{ backgroundImage: `url(${v.product_img_path})` }}></span>
											</Link>
											<button
												type="button" id={v.product_id}
												className={ likeState(v.product_id) ? "btn_favorit on" : "btn_favorit" }
												name={v.product_id} onClick={() => likeProduct(v.product_id)}>
												<span className="i-set i_favorit">좋아요</span>
											</button>
										</div>
										<div className="txt">
											<Link to={`products/${v.product_id}`}>
												<p className="t1">{v.brand.brand_name}</p>
												<p className="t2">{v.product_name}</p>
											</Link>
										</div>
									</div>
								)
							})}
						</Slider>
					</div>
					<h2 className="h_tit1">
						<Link to="/mypage/event">
							<span className="i-aft i_link1">
								<strong className="c-blue usernick">{username}</strong>님에게 추천해 드리는 키인 이벤트!
							</span>
						</Link>
					</h2>
					<div className="area_ad">
						{eventList.reverse().slice(0, 2).map((v) => {
							return (
								<div key={v.event_posting_date} className="main">
									<Link to={`/mypage/event/view?event_id=${v.event_id}`}>
										<div className="img"><img src={v.event_image_path}></img></div>
									</Link>
								</div>
							)
						})}
					</div>
		
				</div>
				<footer id="footer" className="footer">
					<ul className="div1">
						<li className="off" id="fmenu1"><Link to="/test"><span className="i-aft i_fmenu1">평가</span></Link></li>
						<li className="off" id="fmenu2"><Link to="/mykiin"><span className="i-aft i_fmenu2">MY키인</span></Link></li>
						<li className="off" id="fmenu3"><Link to="/main"><span className="i-aft i_fmenu3">메인</span></Link></li>
						<li className="off" id="fmenu4"><Link to="/search"><span className="i-aft i_fmenu4">제품검색</span></Link></li>
						<li className="off" id="fmenu5"><Link to="/mypage"><span className="i-aft i_fmenu5">마이페이지</span></Link></li>
					</ul>
				</footer>
			</div>
		</div>
    )
}

export default Main;