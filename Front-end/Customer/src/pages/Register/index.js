import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import request from '~/utils/request';
import Images from '~/assets/images';
import classes from '../Login/Login.module.scss';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [validEmail, setValidEmail] = useState(false);

    const [pass, setPass] = useState('');
    const [validPass, setValidPass] = useState(false);

    const [rewritePass, setRewritePass] = useState('');
    const [validReWritePass, setValidRewritePass] = useState(false);

    const [otp, setOtp] = useState('');
    const [otpVerify, setOtpVerify] = useState('');
    const [confirmEmail, setConfirmEmail] = useState(false);

    async function handleSentOtp() {
        console.log('sent otp');
        await request
            .post('auth/otp', { email: email })
            .then((res) => {
                setConfirmEmail(true);
                console.log(res.data);
                setOtpVerify(res.data.otpVerify);
            })
            .catch((err) => console.log(err));
    }

    function handleEmailCheck() {
        const mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        const checkEmail = mailFormat.test(email);

        if (!checkEmail) setValidEmail(true);
        else setValidEmail(false);
    }

    function handlePasswordCheck() {
        const passFormat = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        const checkPass = passFormat.test(pass);
        if (!checkPass) setValidPass(true);
        else setValidPass(false);
    }

    function handleRewritePassCheck() {
        if (rewritePass !== pass && !validPass) setValidRewritePass(true);
        else setValidRewritePass(false);
        console.log(validEmail, pass, rewritePass);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (validEmail || validPass || validReWritePass) {
            alert('L???i ????ng k??!!!');
            return;
        }
        var objResgister = {
            name: 'Long dep trai',
            email: email,
            password: pass,
            otp: otp,
            otpVerify: otpVerify,
        };

        // make axios post
        await request
            .post('auth/register', objResgister)
            .then((res) => {
                console.log(res.data);
                setEmail('');
                setPass('');
                setRewritePass('');
                setOtp('');
                alert('T??i kho???n h???p l???!\nB???n ???? ????ng k?? th??ng c??ng. H??y quay v??? ????ng nh???p.');
            })
            .catch((error) => alert(error.response.data.msg));
        // setSuccess(true);
    }

    // useEffect(() => {}, [success]);

    return (
        <div className={classes.wrapper}>
            <div className={classes.wrapper__logo}>
                <img src={Images.logoImage} alt="none" />
            </div>
            <div className={classes.wrapper__form}>
                <h2>????ng K??</h2>
                <form onSubmit={handleSubmit}>
                    <p>
                        <input
                            type="text"
                            name="first__name"
                            required
                            placeholder="Nh???p email c???a b???n"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={handleEmailCheck}
                        />
                        <text>
                            {validEmail ? (
                                <div>
                                    <FontAwesomeIcon icon={faExclamationCircle} />
                                    Email kh??ng h???p l???.
                                </div>
                            ) : (
                                ''
                            )}
                        </text>
                    </p>
                    {!confirmEmail ? (
                        <p>
                            <button type="button" value="OTP" id={classes.sub__btn} onClick={handleSentOtp}>
                                G???i OTP
                            </button>
                        </p>
                    ) : (
                        <>
                            <p>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="Nh???p m???t kh???u c???a b???n"
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    onBlur={handlePasswordCheck}
                                />
                                <text>
                                    {validPass ? (
                                        <div className={classes.error__password}>
                                            <FontAwesomeIcon icon={faExclamationCircle} />
                                            T???i thi???u 6 k?? t???, ??t nh???t m???t ch??? c??i v?? m???t s???.
                                        </div>
                                    ) : (
                                        ''
                                    )}
                                </text>
                            </p>
                            <p>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    placeholder="X??c nh???n m???t kh???u"
                                    value={rewritePass}
                                    onChange={(e) => setRewritePass(e.target.value)}
                                    onBlur={handleRewritePassCheck}
                                />
                                <text>
                                    {validReWritePass ? (
                                        <div className={classes.error__rewrite__password}>
                                            <FontAwesomeIcon icon={faExclamationCircle} />
                                            M???t kh???u kh??ng tr??ng kh???p.
                                        </div>
                                    ) : (
                                        ''
                                    )}
                                </text>
                            </p>
                            <p>
                                <input
                                    type="text"
                                    name="OTP"
                                    required
                                    placeholder="Nh???p m?? OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </p>
                            <p>
                                <button id={classes.sub__btn} type="submit">
                                    ????ng k??
                                </button>
                            </p>
                        </>
                    )}
                </form>
                <footer>
                    <p>
                        B???n ???? c?? t??i kho???n? <Link to="/login">????ng nh???p</Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
