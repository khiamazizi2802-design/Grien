const fs = require('fs');

['admin-portal/src/pages/AdminDashboard.jsx', 'client/src/pages/AdminDashboard.jsx'].forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    const target = `triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);
                }
            } catch (e) {`;
    const targetCRLF = `triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);\r
                }\r
            } catch (e) {`;

    const rep = `triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);
            } catch (e) {`;

    if (code.includes(target)) {
        code = code.replace(target, rep);
        fs.writeFileSync(f, code, 'utf8');
        console.log('Fixed brace in', f, '(LF)');
    } else if (code.includes(targetCRLF)) {
        code = code.replace(targetCRLF, rep);
        fs.writeFileSync(f, code, 'utf8');
        console.log('Fixed brace in', f, '(CRLF)');
    } else {
        // regex
        const regex = /triggerNotification\('success', 'Driver Document Approved ✓', `Credential \$\{docId\} cleared for driver\.`\);\s*\}\s*\} catch \(e\) \{/;
        if (regex.test(code)) {
            code = code.replace(regex, `triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);\n            } catch (e) {`);
            fs.writeFileSync(f, code, 'utf8');
            console.log('Fixed brace via regex in', f);
        } else {
            console.log('Target not found in', f);
        }
    }
});
