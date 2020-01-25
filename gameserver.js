http=require('http')
fs=require('fs')
const ws = require('ws')  
const readFile = f => new Promise((res, rej) => fs.readFile(f, 'utf8', (e, data) => e?rej(e):res(data)))
server_send={}
board_init=()=>{ 
board=[]
board=new Array(6)

for (let i=0;i<6;i++)
{
    board[i]=new Array(7)
}
for(let i=0;i<6;i++)
{
    for (let j=0;j<7;j++)
    {
        board[i][j]=""
    }
}
return board
}
search=(board,col_no)=>{
    for(let i=5;i=>0;i--)
    {   
        if(board[i][col_no]=="")
        {
               
            return i;
            
        }
    }

}
draw=(board)=>{
    for(i=0;i<7;i++)
    {
        if(board[0][i]=="")
        {
            return false
        }
    }
    return true
}
win=(board,row,col,color)=>
{
    counterx=0
    countery=0
    counterxy=0
    counteryx=0
    for(i=1;i<4;i++)
    {
        if(col-i > -1)
        {   
            if(board[row][col-i]!=color)
            {
                break
            }
            counterx ++
              
        }
        else{
            break
        }
        if(counterx > 2)
        {
                return true
         } 
    }
    x=counterx
    for(i=1;i<4-x;i++)
    {
        if(col+i < 7)
        {   
            if(board[row][col+i]!=color)
            {
                break
            }
            counterx ++
        }
        else{
            break
        }
        if(counterx >2)
        {
                return true
        }

    }
    for(i=1;i<4;i++)
    {
        if(row + i < 6)
        {
            if(board[row+i][col]!=color)
            {
                break
            }
            countery++
        }
        else {
            break
        }
        if(countery> 2 )
        {
            return true
        }

    }
    for(i=1;i<4;i++)
    {   
        if((row + i) < 6 && (col - i) > -1)
        { 
            if(board[row+i][col-i]!=color)
            {
               break
            }
            counteryx++
            
        }
        else {
            break
        }
        if(counteryx > 2)
        {
            return true
        }
    
    }
    y1=counteryx
    for (i=1;i<4-y1;i++)
    {
        if((row - i) > -1 && (col + i) < 7)
        { 
            if(board[row-i][col+i]!=color)
            {
               break
            }
            counteryx++
            
        }
        else {
            break
        }
        if(counteryx > 2)
        {
            return true
        }
    
    }
    
    for(i=1;i<4;i++)
    {
        if((row + i) < 6 && (col + i) < 7)
        { 
            if(board[row+i][col+i]!=color)
            {
                break
            }
            counterxy++
            
        }
        else {
            break
        }
       
        if(counterxy > 2)
        {
            return true
        }
    
    }
    y2=counterxy
    for(i=1;i<4-y2;i++)
    {
        if((row - i) >-1 && (col - i) >-1)
        { 
            if(board[row-i][col-i]!=color)
            {
                break
            }
            counterxy++
            
        }
        else {
            break
        }
       
        if(counterxy > 2)
        {
            return true
        }
    
    }

    
    return false
    
}

const server=http.createServer(async (req,res)=>{
    
    if(req.url==='/')
    {
        res.end(await readFile('connect4.html'))
    }
    if (req.url==='/style.css')
    {
        res.end(await readFile('style.css'))
    }
  
    else if(req.url==='/vue.js')
    {
        res.end(await readFile('vue.js'))
    }
    else if(req.url==='/clientside.js')
    {
        res.end(await readFile('clientside.js'))
    }
    else {
        res.end()
    }
  
}).listen(5000)
games=[]
Clients=[]
turn=0
color1=['RED','BLUE']
color_index = 0;



new ws.Server({server}).on('connection',client=>{
    console.log("A USER APPEARED ")
    Clients.push(client)
    server_send["type"]="connection"
    server_send["color"]=color1[color_index]
    server_send["game_id"]=games.length
    color_index = (color_index + 1) % 2;    
    client.send(JSON.stringify(server_send))
    
    if(Clients.length==2)
    {   game={}
        board=board_init()
        game["id"]=games.length
        game["board"]=board
        game["clients"]=Clients
        game["turn"]=0
        games.push(game)  
        server_send["type"]="start"
        
        server_send["board"]=games[game["id"]].board
        server_send["server_msgs"]=`PLAYER ${games[game["id"]].turn + 1} turn`
         
        games[game["id"]].clients.forEach(cl=>{
        cl.send(JSON.stringify(server_send))   
        
        })
        Clients=[]
    }
    client.on('message',raw=>{
        data=JSON.parse(raw)
        col=data.column
        color=data.color
        id=data.game_id
        board=games[id].board
        clients=games[id].clients
        
        if(color=='RED' && games[id].turn == 1)
        {   
            return
        }
        if(color=='BLUE' && games[id].turn==0)
        {   
            return 

        }
        
        else {
                
                if(board[0][col])
                {   server_send["type"]="err"
                    server_send["err_msgs"]="COLUMN FULL !! "
                    client.send(JSON.stringify(server_send))
                    return
                }
                row=search(board,col)
                board[row][col]=color
                server_send["type"]="clicked"
                server_send["board"]=board
                check=win(board,row,col,color)
                if(check)
                {
                    server_send["type"]="check"
                    server_send["server_msgs"]=`PLAYER ${games[id].turn+1} WINS RESTARTING GAME`
                    clients.forEach(cl=>{
                        cl.send(JSON.stringify(server_send))
                    })
                    setTimeout(()=>{
                        for(let i=0;i<6;i++)
                    {
                        for (let j=0;j<7;j++)
                        {
                            board[i][j]=""
                        }
                    }
                    games[id].board=board
                    games[id].turn= 0
                    server_send["type"]="start"
                    server_send["board"]=games[id].board
                    server_send["server_msgs"]=`PLAYER ${games[id].turn + 1} TURN`   
                    clients.forEach(cl=>{
                        
                        cl.send(JSON.stringify(server_send))
                    })       
                    
                   
                    },2000)
                    return
                   
                }
                else if(draw(board))
                {
                    server_send["type"]="check"
                    server_send["server_msgs"]=`GG!! GAME DRAWN WINS RESTARTING GAME`
                    clients.forEach(cl=>{
                        cl.send(JSON.stringify(server_send))
                    })
                    setTimeout(()=>{
                        for(let i=0;i<6;i++)
                    {
                        for (let j=0;j<7;j++)
                        {
                            board[i][j]=""
                        }
                    }
                    games[id].board=board
                    games[id].turn= 0
                    server_send["type"]="start"
                    server_send["board"]=games[id].board
                    server_send["server_msgs"]=`PLAYER ${games[id].turn + 1} TURN`   
                    clients.forEach(cl=>{
                        
                        cl.send(JSON.stringify(server_send))
                    })       
                    
                   
                    },2000)
                    return
                   
                }
                

                games[id].turn = (games[id].turn + 1) % 2;
                server_send["server_msgs"]=`PLAYER ${games[id].turn+1} TURN `
                    clients.forEach(cl=>
                    {
                        
                    cl.send(JSON.stringify(server_send))  
                    })
            

        }
        
    })
    

   
})


   